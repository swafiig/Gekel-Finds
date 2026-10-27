"use client";
import { calcFee } from "./constants";
import { money } from "./format";
import { MIN } from "./rng";
import { actor, assignRider, emit, getDb, log, nearestRider, ord, pushEvent, rid, setStatus, sup } from "./store";
import type { Config, Dispute, DocState, Order, RoleName, Supplier } from "./types";

const touch = <T,>(v: T) => { emit(); return v; };

/* ---------- orders ---------- */
export function nudgeSupplier(o: Order) { o.log.push({ at: Date.now() - 1, t: `Reminder sent to ${sup(o.sid).name} by SMS and app` }); log("Messaged supplier", o.code, "Reminder to confirm payment"); touch(0); }
export function nudgeMany(list: Order[]) { list.forEach((o) => o.log.push({ at: Date.now(), t: `Reminder sent to ${sup(o.sid).name}` })); log("Messaged suppliers", `${list.length} orders`, "Bulk reminder"); touch(0); }
export function assignManual(o: Order, riderId: string) {
  const r = rid(riderId); const old = o.rider ? rid(o.rider) : null;
  if (old) { old.job = null; old.status = "online"; }
  assignRider(o, r, actor()); log(old ? "Reassigned rider" : "Assigned rider", o.code, `${old ? old.name + " to " : ""}${r.name}`); touch(0); return r;
}
export function autoAssignAll(hubOk: (o: Order) => boolean) {
  let n = 0; getDb().orders.filter((o) => hubOk(o) && o.status === "ready" && !o.rider).forEach((o) => { const r = nearestRider(o); if (r) { assignRider(o, r, actor()); n++; } });
  log("Auto-assigned riders", `${n} orders`, "Nearest free rider"); touch(0); return n;
}
export function messageOrder(o: Order, who: "supplier" | "buyer", text: string) { o.log.push({ at: Date.now(), t: `Message to ${who}: "${text}"` }); log("Messaged " + who, o.code, text); touch(0); }
export function cancelOrder(o: Order, reason: string) {
  const r = o.rider ? rid(o.rider) : null; if (r) { r.job = null; r.status = "online"; }
  setStatus(o, "cancelled", `Cancelled by ${actor()}: ${reason}`); log("Cancelled order", o.code, reason); touch(0);
}
export function openDispute(o: Order, kind: string) {
  const d = getDb(); const id = "DIS-" + (883 + d.disputes.length);
  d.disputes.unshift({ id, order: o.id, kind, sev: "med", status: "open", openedBy: "Support", at: Date.now(), sla: Date.now() + 180 * MIN, claim: `Opened by ${actor()} from the order page.`, amount: o.itemsTotal, evidence: o.proofs.map((p) => ({ ...p })), chat: [], buyer: o.buyer, sid: o.sid });
  o.dispute = id; o.status = "disputed"; o.log.push({ at: Date.now(), t: `Dispute ${id} opened: ${kind}` }); log("Opened dispute", id, `${kind} on ${o.code}`); touch(0); return id;
}

/* ---------- requests ---------- */
export function broadcastRequest(id: string) { const q = getDb().requests.find((x) => x.id === id)!; const n = getDb().suppliers.filter((s) => s.status === "verified" && s.hub === q.hub).length; log("Broadcast request", q.code, `Pushed to ${n} verified suppliers in ${q.hub}`); pushEvent(`${q.code} pushed to ${n} suppliers in ${q.hub}`, "req"); q.at = Math.max(q.at, Date.now() - 60000); touch(0); return { q, n }; }
export function closeRequest(id: string) { const q = getDb().requests.find((x) => x.id === id)!; q.status = "expired"; log("Closed request", q.code, "Expired manually"); touch(0); return q; }
export function broadcastMessage(to: string, text: string) { log("Broadcast", to, text); pushEvent(`Broadcast to ${to.toLowerCase()}: ${text}`, "msg"); touch(0); }

/* ---------- suppliers ---------- */
export const DOCS: [string, string, string][] = [["id", "Owner ID", "National ID matches the owner"], ["permit", "Business permit", "County single business permit, in date"], ["stall", "Stall photo", "Photo shows the stall number and stock"], ["till", "Till check", "Till name matches owner or registered business"], ["visit", "Site visit", "A GEKEL agent has seen the stall"]];
export const docDone = (v: DocState | undefined) => v === "ok" || v === "done";
export function setDoc(s: Supplier, k: string, v: DocState) { s.docs![k] = v; if (k === "till" && v === "ok") s.risk = (s.risk ?? []).filter((r) => !r.startsWith("Till name")); log(v === "todo" ? "Reopened check" : "Marked check verified", s.name, DOCS.find((d) => d[0] === k)![1]); touch(0); }
export function approveSupplier(s: Supplier) { Object.assign(s, { status: "verified", score: 80, orders: 0, disputeRate: 0, quoteMins: 0, joined: 0 }); log("Approved supplier", s.name, `Till ${s.till}`); pushEvent(`${s.name} is now a verified supplier`, "sup"); touch(0); }
export function rejectSupplier(s: Supplier, reason: string) { const d = getDb(); d.suppliers.splice(d.suppliers.indexOf(s), 1); log("Rejected supplier", s.name, reason); touch(0); }
export function askSupplier(s: Supplier, msg: string) { s.notes = (s.notes ? s.notes + "\n" : "") + "Asked: " + msg; log("Requested information", s.name, msg); touch(0); }
export function messageSupplier(s: Supplier, msg: string) { log("Messaged supplier", s.name, msg); touch(0); }
export function suspendSupplier(s: Supplier, reason: string) { s.status = "suspended"; s.note = reason; log("Suspended supplier", s.name, reason); touch(0); }
export function reinstateSupplier(s: Supplier) { s.status = "verified"; s.note = ""; log("Reinstated supplier", s.name, ""); touch(0); }
export function saveNote(s: Supplier, v: string) { s.notes = v; emit(); }

/* ---------- riders ---------- */
export function messageRider(name: string, msg: string) { log("Messaged rider", name, msg); touch(0); }
export function suspendRider(id: string, reason: string) {
  const r = rid(id);
  if (r.job) { const o = ord(r.job.order)!; o.rider = null; o.status = "ready"; o.noAuto = false; o.log.push({ at: Date.now(), t: `${r.name} suspended. Returned to dispatch.` }); r.job = null; }
  r.status = "suspended"; r.note = reason; log("Suspended rider", r.name, reason); touch(0);
}
export function reinstateRider(id: string) { const r = rid(id); r.status = "offline"; r.note = ""; log("Reinstated rider", r.name, ""); touch(0); }

/* ---------- disputes ---------- */
export type Ruling = "buyer" | "supplier" | "split" | "fee" | "dismiss";
export function rulingText(d: Dispute, k: Ruling): [string, string] {
  const s = sup(d.sid!).name;
  return ({ buyer: ["Sided with buyer", `${s} refunds ${money(d.amount)} to ${d.buyer} directly. GEKEL fee is also refunded.`], supplier: ["Sided with supplier", "No refund. The buyer is told why."], split: ["Split", `${s} refunds half (${money(d.amount / 2)}) to the buyer.`], fee: ["GEKEL fee refunded", "Only the GEKEL service fee goes back to the buyer."], dismiss: ["Dismissed", "Closed with no action."] } as const)[k] as [string, string];
}
export function ruleDispute(d: Dispute, k: Ruling, note: string) {
  const [title] = rulingText(d, k); d.status = "resolved"; d.ruling = title; d.note = note; d.resolvedAt = Date.now();
  const o = d.order ? ord(d.order) : undefined; if (o) { o.log.push({ at: Date.now(), t: `Dispute ${d.id} resolved: ${title}` }); if (o.status === "disputed") o.status = "delivered"; }
  if (k === "buyer") { const s = sup(d.sid!); s.score = Math.max(0, (s.score ?? 0) - 2); }
  log("Ruled on dispute", d.id, `${title}: ${note}`); pushEvent(`${d.id} resolved: ${title}`, "dis"); touch(0);
}
export function replyDispute(d: Dispute, text: string) { d.chat.push(["Support", actor(), text]); log("Replied on dispute", d.id, text); touch(0); }

/* ---------- payments ---------- */
export function matchPayment(ref: string, orderId: string) {
  const d = getDb(); const u = d.unmatched.find((x) => x.ref === ref)!; const o = ord(orderId)!;
  d.unmatched.splice(d.unmatched.indexOf(u), 1); d.feeStream.unshift({ id: "m" + u.ref, order: o.id, ref: u.ref, amount: u.amount, at: Date.now(), state: "matched", ms: 0 });
  o.log.push({ at: Date.now(), t: `GEKEL fee ${u.ref} matched by ${actor()}` }); log("Matched payment", u.ref, `To ${o.code}`); touch(0); return o;
}
export function refundPayment(ref: string, reason: string) { const d = getDb(); const u = d.unmatched.find((x) => x.ref === ref)!; d.unmatched.splice(d.unmatched.indexOf(u), 1); log("Refunded payment", u.ref, reason); touch(0); }

/* ---------- rules and team ---------- */
export const RULE_LABELS: Record<keyof Config, string> = { findFee: "Find fee", baseDelivery: "Base delivery", perKm: "Per kilometre", servicePct: "Service charge", serviceCap: "Service charge cap", riderShare: "Rider share of delivery", offerSecs: "Rider offer timer", radiusKm: "Search radius", maxJobs: "Jobs per rider", quoteWindow: "Quote window", payConfirmSla: "Payment confirmation SLA" };
export function saveConfig(draft: Config) { const c = getDb().config; (Object.keys(draft) as (keyof Config)[]).forEach((k) => { if (draft[k] !== c[k]) { log("Changed rule", RULE_LABELS[k], `${c[k]} to ${draft[k]}`); c[k] = draft[k]; } }); touch(0); }
export function feeFor(items: number, km: number, c: Config) { return calcFee(items, km, c); }
/* ---------- shell ---------- */
export function setHub(h: "All" | "Eastleigh" | "Kamukunji") { getDb().ui.hub = h; emit(); }
export function setRole(r: RoleName) { getDb().ui.role = r; emit(); }
export function setLive(v: boolean) { getDb().ui.live = v; emit(); }

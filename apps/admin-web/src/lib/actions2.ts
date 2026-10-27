"use client";
import { createStaff, removeStaff as rmStaff, resetStaffPassword, setStaffRole, setStaffStatus, staffById, activeSupers } from "./auth";
import { actor, emit, getDb, log, pushEvent, rid } from "./store";
import type { Campaign, Channel, Chama, Dept, Errand, FindReq, Integration, OwnJob, PointsState, Pricing, QuoteAsk, RestockJob, ReturnReq, ReturnState, RoleName, Shelf, Template } from "./types";
import { ERRAND_STAGES, FIND_STAGES, OWN_STAGES, RESTOCK_STAGES, RETURN_LABEL } from "./types";
import { money } from "./format";

const t = <T,>(v: T) => { emit(); return v; };

/* ---------- Find GEKEL ---------- */
export function assignFind(f: FindReq, agent: string) { f.agent = agent; if (f.stage === 0) f.stage = 1; f.notes.push({ at: Date.now(), who: actor(), t: `Assigned to ${agent}` }); log("Assigned finder", f.code, agent); t(0); }
export function noteFind(f: FindReq, text: string) { f.notes.push({ at: Date.now(), who: actor(), t: text }); t(0); }
export function recordFound(f: FindReq, x: { supplier: string; stall: string; phone: string; price: number }) {
  f.found = { ...x, at: Date.now() }; f.stage = 2; f.notes.push({ at: Date.now(), who: actor(), t: `Found at ${x.supplier} for ${money(x.price)}. Sent to buyer to approve.` });
  log("Recorded find", f.code, `${x.supplier}, ${money(x.price)}`); pushEvent(`Found "${f.title}" at ${x.supplier} for ${money(x.price)}`, "req"); t(0);
}
export function advanceFind(f: FindReq) { if (f.stage >= FIND_STAGES.length - 1) return; f.stage++; f.notes.push({ at: Date.now(), who: actor(), t: FIND_STAGES[f.stage] }); log("Moved find", f.code, FIND_STAGES[f.stage]); t(0); }
export function closeFind(f: FindReq, why: "not_found" | "cancelled", reason: string) { f.closed = why; f.notes.push({ at: Date.now(), who: actor(), t: `${why === "not_found" ? "Not found" : "Cancelled"}: ${reason}` }); log(why === "not_found" ? "Could not find item" : "Cancelled find", f.code, reason); t(0); }
export function reopenFind(f: FindReq) { f.closed = undefined; f.notes.push({ at: Date.now(), who: actor(), t: "Reopened" }); log("Reopened find", f.code, ""); t(0); }
export function inviteFoundSupplier(f: FindReq) {
  if (!f.found || f.invited) return; const d = getDb(); const id = "p" + (d.suppliers.length + 1) + Math.floor(Math.random() * 99);
  d.suppliers.push({ id, name: f.found.supplier, owner: f.found.supplier, stall: f.found.stall, hub: f.hub, status: "pending", submitted: 1, till: "", tillName: "", phone: f.found.phone, x: 300, y: 180, docs: { id: "todo", permit: "todo", stall: "todo", till: "todo", visit: "todo" }, risk: [], notes: `Found while sourcing "${f.title}" (${f.code}).` });
  f.invited = true; log("Invited supplier to join", f.found.supplier, `From ${f.code}`); t(0);
}

/* ---------- own-supplier jobs ---------- */
export function assignOwn(j: OwnJob, riderId: string) { const r = rid(riderId); j.rider = riderId; if (j.stage === 0) j.stage = 1; j.notes.push(`${actor()} assigned ${r.name}`); log("Assigned rider", j.code, r.name); t(0); return r; }
export function advanceOwn(j: OwnJob) { if (j.stage >= OWN_STAGES.length - 1) return; j.stage++; log("Moved own-supplier job", j.code, OWN_STAGES[j.stage]); t(0); }
export function cancelOwn(j: OwnJob, reason: string) { j.cancelled = true; log("Cancelled own-supplier job", j.code, reason); t(0); }

/* ---------- errands ---------- */
export function assignRunner(e: Errand, runner: string) { e.runner = runner; if (e.stage === 0) e.stage = 1; log("Assigned runner", e.code, runner); t(0); }
export function advanceErrand(e: Errand) { if (e.stage >= ERRAND_STAGES.length - 1) return; e.stage++; log("Moved errand", e.code, ERRAND_STAGES[e.stage]); t(0); }
export function cancelErrand(e: Errand, reason: string) { e.cancelled = true; log("Cancelled errand", e.code, reason); t(0); }
export function setErrandPrice(e: Errand, price: number) { log("Quoted errand", e.code, money(price)); e.price = price; t(0); }

/* ---------- ask quote ---------- */
export function nudgeQuote(q: QuoteAsk) { q.nudges++; log("Nudged supplier on quote", q.product, `${q.buyer} is waiting`); t(0); }
export function expireQuote(q: QuoteAsk) { q.status = "expired"; log("Closed quote request", q.product, q.buyer); t(0); }

/* ---------- Suluhu desk: returns ---------- */
export function setReturn(r: ReturnReq, status: ReturnState, note: string, payer?: "buyer" | "supplier") {
  r.status = status; if (payer) r.payer = payer; r.notes.push({ at: Date.now(), who: actor(), t: `${RETURN_LABEL[status]}${payer ? `, ${payer} pays return delivery` : ""}${note ? `. ${note}` : ""}` });
  log("Return " + RETURN_LABEL[status].toLowerCase(), r.code, note || r.item); pushEvent(`${r.code} ${RETURN_LABEL[status].toLowerCase()}`, "dis"); t(0);
}

/* ---------- Chama ---------- */
export function nudgeChama(c: Chama) { const n = c.members.filter((m) => !m.paid).length; log("Reminded chama members", c.code, `${n} unpaid`); t(n); return n; }
export function setChama(c: Chama, status: Chama["status"], note: string) { c.status = status; log(status === "cancelled" ? "Cancelled chama order" : "Released chama order", c.code, note); t(0); }

/* ---------- restock and shelves ---------- */
export function advanceRestock(j: RestockJob) {
  if (j.stage >= RESTOCK_STAGES.length - 1) return; j.stage++; log("Moved restock job", j.code, RESTOCK_STAGES[j.stage]);
  if (j.stage === 3) { const s = getDb().shelves.find((x) => x.seller === j.seller); if (s) s.used = Math.min(s.capacity, s.used + j.qty); }
  t(0);
}
export function assignRestockRider(j: RestockJob, riderId: string) { j.rider = riderId; log("Assigned rider", j.code, rid(riderId).name); t(0); }
export function remindShelf(s: Shelf) { log("Sent rent reminder", s.seller, money(s.rentMonthly)); t(0); }

/* ---------- points ---------- */
export function adjustPoints(name: string, pts: number, why: string) {
  const p = getDb().points; const m = p.members.find((x) => x.name === name); if (!m) return false;
  m.balance = Math.max(0, m.balance + pts); if (pts > 0) { m.lifetime += pts; p.issued += pts; } p.ledger.unshift({ at: Date.now(), who: name, kind: "adjust", pts, note: `${why}. By ${actor()}` }); log("Adjusted points", name, `${pts > 0 ? "+" : ""}${pts}: ${why}`); t(0); return true;
}
export function savePoints(d: PointsState) { const p = getDb().points; (["earnPer100", "bonus", "kshPerPoint", "expiryDays"] as const).forEach((k) => { if (d[k] !== p[k]) { log("Changed points rule", k, `${p[k]} to ${d[k]}`); p[k] = d[k]; } }); if (JSON.stringify(d.rewards) !== JSON.stringify(p.rewards)) { p.rewards = d.rewards; log("Edited rewards", "Points", `${d.rewards.length} rewards`); } t(0); }

/* ---------- comms ---------- */
export const AUDIENCES: [string, number][] = [["All buyers", 3180], ["Buyers active in the last 30 days", 1420], ["Buyers in Eastleigh", 640], ["Buyers in Umoja and Donholm", 410], ["Buyers who used Find GEKEL", 96], ["All verified suppliers", 7], ["Suppliers with documents due", 3], ["Pending suppliers", 5], ["All online riders", 9], ["All riders", 12]];
export function sendCampaign(c: { audience: string; channels: Channel[]; title: string; body: string; when?: number }) {
  const d = getDb(); const n = AUDIENCES.find((a) => a[0] === c.audience)?.[1] ?? 0; const later = c.when && c.when > Date.now() + 60000;
  const row: Campaign = { id: "cm" + Date.now(), at: Date.now(), audience: c.audience, channels: c.channels, title: c.title, body: c.body, sent: later ? 0 : n, opened: later ? null : 0, status: later ? "scheduled" : "sent", by: actor(), scheduledFor: later ? c.when : undefined };
  d.campaigns.unshift(row); log(later ? "Scheduled message" : "Sent message", c.audience, `${c.title} (${c.channels.join(", ")}, ${n})`); pushEvent(`${later ? "Scheduled" : "Sent"} to ${c.audience.toLowerCase()}: ${c.title}`, "msg"); t(0); return row;
}
export function saveTemplate(x: Template) { const L = getDb().templates; const i = L.findIndex((y) => y.id === x.id); if (i >= 0) L[i] = x; else L.push(x); log("Saved template", x.name, x.group); t(0); }
export function deleteTemplate(id: string) { const L = getDb().templates; const i = L.findIndex((y) => y.id === id); if (i >= 0) { log("Deleted template", L[i].name, ""); L.splice(i, 1); } t(0); }
export function toggleAuto(id: string, ch: "push" | "sms" | "inapp") { const a = getDb().autos.find((x) => x.id === id)!; a[ch] = !a[ch]; log("Changed automatic message", a.event, `${ch} ${a[ch] ? "on" : "off"}`); t(0); }

/* ---------- tech ---------- */
export function setMaintenance(key: string, on: boolean) { const a = getDb().apps.find((x) => x.key === key)!; a.maintenance = on; a.state = on ? "down" : "up"; a.note = on ? "Maintenance mode. Users see a friendly 'back soon' screen." : undefined; log(on ? "Turned on maintenance mode" : "Turned off maintenance mode", a.name, ""); pushEvent(`${a.name}: maintenance ${on ? "on" : "off"}`, "sys"); t(0); }
export function setMinVersion(key: string, v: string) { const a = getDb().apps.find((x) => x.key === key)!; log("Set minimum version", a.name, `${a.minVersion} to ${v}`); a.minVersion = v; t(0); }
export function testIntegration(id: string): "connected" | "error" { const i = getDb().integrations.find((x) => x.id === id)!; const ok = i.fields.filter((f) => f.set).length === i.fields.length || i.cat === "Couriers"; i.lastCheck = Date.now(); if (ok) { i.status = i.env === "sandbox" ? "sandbox" : "connected"; } else { i.status = i.fields.some((f) => f.set) ? "error" : "not_connected"; } log("Tested integration", i.name, ok ? "Passed" : "Missing details"); t(0); return ok ? "connected" : "error"; }
export function saveIntegration(id: string, values: Record<string, string>, env: Integration["env"]) {
  const i = getDb().integrations.find((x) => x.id === id)!;
  i.fields.forEach((f) => { const v = values[f.key]?.trim(); if (v) { f.set = true; f.last4 = f.secret ? v.slice(-4) : v.slice(-6); } }); if (i.env !== "n/a") i.env = env;
  log("Updated integration", i.name, `${i.fields.filter((f) => f.set).length}/${i.fields.length} details set. Secrets are not shown here.`); t(0);
}
export function addIntegration(x: { name: string; cat: Integration["cat"]; why: string; link: string; fields: string }) {
  getDb().integrations.push({ id: "x" + Date.now(), name: x.name, cat: x.cat, why: x.why, phase: "Later", status: "not_connected", env: "n/a", link: x.link, lastCheck: null, custom: true, steps: ["Write down where you got the keys and who owns the account.", "Add the keys here once you have them."], fields: x.fields.split(",").map((s) => s.trim()).filter(Boolean).map((l, i) => ({ key: "f" + i, label: l, secret: /key|secret|token|pass/i.test(l), set: false })) });
  log("Added integration", x.name, x.cat); t(0);
}
export function removeIntegration(id: string) { const L = getDb().integrations; const i = L.findIndex((x) => x.id === id); if (i >= 0) { log("Removed integration", L[i].name, ""); L.splice(i, 1); } t(0); }

/* ---------- pricing and rules ---------- */
export function savePricing(d: Pricing) {
  const p = getDb().pricing; const diffs: string[] = [];
  (Object.keys(d) as (keyof Pricing)[]).forEach((k) => { if (JSON.stringify(d[k]) !== JSON.stringify(p[k])) diffs.push(k); });
  const names: Record<string, string> = { zones: "Nairobi delivery fees", fallbackStd: "Other-area standard fee", fallbackExp: "Other-area express fee", freeOver: "Free delivery threshold", freeAppliesTo: "Free delivery applies to", counties: "Up-country couriers", offers: "Offers", holidays: "Holidays", gifts: "Gift rules", errands: "Errand prices", ownSupplierFee: "Own-supplier fee", shelfRent: "Shelf rent" };
  diffs.forEach((k) => log("Changed rule", names[k] ?? k, typeof d[k as keyof Pricing] === "object" ? "Table edited" : `${p[k as keyof Pricing]} to ${d[k as keyof Pricing]}`));
  Object.assign(p, JSON.parse(JSON.stringify(d))); t(0); return diffs.length;
}

/* ---------- staff (accounts live in auth.ts, the audit trail lives here) ---------- */
export async function addStaff(i: { name: string; email: string; phone: string; dept: Dept; role: RoleName }) { const r = await createStaff(i, actor()); if (!("error" in r)) { log("Added staff", r.staff.email, `${r.staff.role}, ${r.staff.dept}. Password handed over.`); emit(); } return r; }
export async function resetStaff(id: string) { const s = staffById(id)!; const pw = await resetStaffPassword(id); log("Reset password", s.email, "New one-time password issued"); emit(); return pw; }
export function switchStaff(id: string, on: boolean) { const s = staffById(id)!; if (!on && s.role === "Super admin" && activeSupers() <= 1) return "You need at least one active Super admin."; setStaffStatus(id, on ? "active" : "disabled"); log(on ? "Switched staff on" : "Switched staff off", s.email, ""); emit(); return null; }
export function changeStaffRole(id: string, role: RoleName, dept: Dept) { const s = staffById(id)!; if (s.role === "Super admin" && role !== "Super admin" && activeSupers() <= 1) return "You need at least one active Super admin."; log("Changed role", s.email, `${s.role} to ${role}`); setStaffRole(id, role, dept); emit(); return null; }
export function deleteStaff(id: string) { const s = staffById(id)!; if (s.role === "Super admin" && activeSupers() <= 1) return "You need at least one active Super admin."; log("Removed staff", s.email, s.role); rmStaff(id); emit(); return null; }

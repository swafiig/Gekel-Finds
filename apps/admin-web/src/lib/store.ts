"use client";
import { useSyncExternalStore } from "react";
import { AREAS, BUYERS, HUBS, PERMS, ROLE_PERMS, STATUS, calcFee } from "./constants";
import { dist, minsSince, ageTxt, money } from "./format";
import { between, pick, rnd } from "./rng";
import { createDb, makeOrder } from "./seed";
import type { Db, Order, PermKey, Request, Rider, StatusKey, Supplier } from "./types";

/* A tiny external store. The sample data lives in memory; swap these functions for API calls later. */
let db: Db | null = null;
let version = 0;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export function emit() { version++; subs.forEach((f) => f()); }
export function initDb() { if (!db) { db = createDb(); emit(); } }
export const getDb = () => db as Db;
/** Returns the database once it exists on the client, otherwise null (server render and first paint). */
export function useDb(): Db | null { useSyncExternalStore(subscribe, () => version, () => 0); return db; }

export const sup = (id: string) => getDb().suppliers.find((s) => s.id === id) as Supplier;
export const rid = (id: string) => getDb().riders.find((r) => r.id === id) as Rider;
export const ord = (id: string) => getDb().orders.find((o) => o.id === id) as Order | undefined;
export const inHub = (x: { hub: string }) => getDb().ui.hub === "All" || x.hub === getDb().ui.hub;
export const can = (p: PermKey) => ROLE_PERMS[getDb().ui.role].includes(p);
export const since = (o: Order) => o.log[o.log.length - 1].at;
export const permName = (p: PermKey) => PERMS.find((x) => x[0] === p)![1];

export function log(act: string, tgt: string, d: string) {
  const { ui } = getDb(); const who = "Rashid Mwangi" + (ui.role !== "Super admin" ? ` (as ${ui.role})` : "");
  getDb().audit.unshift({ at: Date.now(), who, act, tgt, d });
}

/* ---------- alerts ---------- */
export type AlertAct = "nudge" | "open-order" | "broadcast-req" | "open-dispute" | "open-rider" | "open-supplier";
export interface Alert { sev: number; icon: string; cls: string; t: string; s: string; label: string; act: AlertAct; id: string }
export function getAlerts(): Alert[] {
  const d = getDb(); const L: Alert[] = [];
  d.orders.forEach((o) => {
    if (!inHub(o)) return; const m = minsSince(since(o)); const s = sup(o.sid);
    if (o.status === "payment_submitted" && m > d.config.payConfirmSla) L.push({ sev: 2, icon: "clock", cls: "", t: `${s.name} hasn't confirmed payment`, s: `${o.code} · ${money(o.itemsTotal)} · waiting ${ageTxt(since(o))}`, label: "Nudge", act: "nudge", id: o.id });
    if (o.status === "ready" && !o.rider && m > 3) L.push({ sev: 3, icon: "bike", cls: "bad", t: `No rider for ${o.code}`, s: `${s.name} to ${o.area} · waiting ${ageTxt(since(o))}`, label: "Assign", act: "open-order", id: o.id });
    if (o.status === "awaiting_payment" && m > 20) L.push({ sev: 1, icon: "wallet", cls: "acc", t: `${o.buyer} hasn't paid ${o.code}`, s: `${money(o.itemsTotal)} to Till ${s.till} · ${ageTxt(since(o))}`, label: "Open", act: "open-order", id: o.id });
  });
  d.requests.forEach((q) => { if (q.status === "open" && inHub(q) && q.quotes === 0 && minsSince(q.at) > 8) L.push({ sev: 2, icon: "request", cls: "", t: `No quotes yet on "${q.title}"`, s: `${q.code} · ${q.buyer} · ${ageTxt(q.at)} old`, label: "Broadcast", act: "broadcast-req", id: q.id }); });
  d.disputes.forEach((x) => { if (x.status !== "resolved") { const left = (x.sla - Date.now()) / 60000; if (left < 25) L.push({ sev: 3, icon: "shield", cls: "bad", t: `${x.id} ${left < 0 ? "is past its SLA" : "SLA ends in " + Math.max(1, Math.round(left)) + "m"}`, s: `${x.kind} · ${money(x.amount)}`, label: "Open", act: "open-dispute", id: x.id }); } });
  d.riders.forEach((r) => { if (r.status !== "suspended" && inHub(r) && r.insurance <= 7) L.push({ sev: 1, icon: "alert", cls: "", t: `${r.name}'s insurance expires in ${r.insurance} days`, s: `${r.plate} · ${r.vehicle}`, label: "Open", act: "open-rider", id: r.id }); });
  d.suppliers.forEach((s) => { if (s.status === "pending" && inHub(s) && (s.submitted ?? 0) > 24 * 60) L.push({ sev: 1, icon: "store", cls: "acc", t: `${s.name} has waited ${Math.floor((s.submitted ?? 0) / 60)}h for review`, s: s.stall, label: "Review", act: "open-supplier", id: s.id }); });
  return L.sort((a, b) => b.sev - a.sev);
}

/* ---------- live engine ---------- */
export function pushEvent(txt: string, kind = "") { const e = getDb().events; e.unshift({ at: Date.now(), txt, kind, fresh: true }); if (e.length > 60) e.pop(); }
export const idleRiders = () => getDb().riders.filter((r) => r.status === "online" && !r.job);
export function nearestRider(o: Order) { const s = sup(o.sid); return idleRiders().sort((a, b) => dist(a.x, a.y, s.x, s.y) - dist(b.x, b.y, s.x, s.y))[0] as Rider | undefined; }
export function assignRider(o: Order, r: Rider, who?: string) {
  o.rider = r.id; o.noAuto = false; r.status = "busy"; r.job = { order: o.id, phase: "pickup" }; const s = sup(o.sid); r.tx = s.x; r.ty = s.y;
  o.log.push({ at: Date.now(), t: `${r.name} ${who ? "assigned by " + who : "accepted the offer"}` }); pushEvent(`${r.name} heading to ${s.name} for ${o.code}`, "ride");
}
export function setStatus(o: Order, st: StatusKey, note: string) { o.status = st; o.log.push({ at: Date.now(), t: note }); }

export function tickEngine() {
  const d = getDb();
  d.riders.forEach((r) => {
    if (r.status === "online" && !r.job && rnd() < 0.08) { const h = HUBS[r.hub]; r.tx = h.x + between(-70, 70); r.ty = h.y + between(-50, 50); }
    const dd = dist(r.x, r.y, r.tx, r.ty);
    if (dd > 3) { const step = Math.max(5, dd * 0.16); r.x += ((r.tx - r.x) / dd) * Math.min(step, dd); r.y += ((r.ty - r.y) / dd) * Math.min(step, dd); }
    if (r.job && dd < 9) {
      const o = ord(r.job.order); if (!o) return;
      if (r.job.phase === "pickup") { r.job.phase = "deliver"; r.tx = o.destX; r.ty = o.destY; setStatus(o, "in_transit", `${r.name} scanned the seal and left ${sup(o.sid).name}`); pushEvent(`${r.name} picked up ${o.code}`, "ride"); }
      else { setStatus(o, "delivered", `Delivered by ${r.name}, customer PIN verified`); o.proofs.push({ cap: "Handed to customer", at: Date.now(), gps: o.area, seal: true }); r.job = null; r.status = "online"; r.trips++; r.earn += 300; pushEvent(`${o.code} delivered to ${o.buyer} in ${o.area}`, "done"); }
    }
  });
  d.orders.forEach((o) => {
    const s = sup(o.sid);
    if (o.status === "awaiting_payment" && rnd() < 0.07) { o.mpesa = "SKJ" + between(1000, 9999) + "P2L9"; setStatus(o, "payment_submitted", `Buyer submitted M-Pesa code ${o.mpesa}`); pushEvent(`${o.buyer} paid ${money(o.itemsTotal)} to ${s.name}`, "pay"); }
    else if (o.status === "payment_submitted" && !o.slow && rnd() < 0.08) { setStatus(o, "paid", `${s.name} confirmed ${money(o.itemsTotal)} received`); pushEvent(`${s.name} confirmed payment for ${o.code}`, "pay"); d.feeStream.unshift({ id: "f" + o.id, order: o.id, ref: "QKB" + between(10000, 99999) + "Z", amount: o.fee, at: Date.now(), state: "matched", ms: between(400, 2100) }); }
    else if (o.status === "paid" && rnd() < 0.1) { setStatus(o, "packed", "Packing proof uploaded, seal scanned"); o.proofs.push({ cap: "Packed and sealed", at: Date.now(), gps: s.stall, seal: true }); pushEvent(`${s.name} packed ${o.code}`, "order"); }
    else if (o.status === "packed" && rnd() < 0.12) { setStatus(o, "ready", "Marked ready for pickup, handoff code issued"); pushEvent(`${o.code} is ready at ${s.name}`, "order"); }
    else if (o.status === "ready" && !o.rider && !o.noAuto && rnd() < 0.45) { const r = nearestRider(o); if (r) assignRider(o, r); }
  });
  if (rnd() < 0.2) { const o = makeOrder(d, "awaiting_payment", 0); o.createdAt = Date.now(); o.log = [{ at: Date.now(), t: "Order created from accepted quote" }]; d.orders.unshift(o); pushEvent(`New order ${o.code}: ${o.buyer} from ${sup(o.sid).name}, ${money(o.itemsTotal)}`, "order"); d.hourly.today[new Date().getHours()]++; }
  if (rnd() < 0.08) { const q: Request = { id: "q" + Date.now(), code: "#RFQ-" + (4094 + d.requests.length), title: pick(["Aluminium cooking pots", "School uniform polo shirts", "Leather sandals, mixed sizes", "USB-C chargers"]), qty: between(10, 60), unit: "pcs", buyer: pick(BUYERS), hub: pick(["Eastleigh", "Kamukunji"] as const), budget: between(8, 60) * 1000, at: Date.now(), quotes: 0, status: "open" }; d.requests.unshift(q); pushEvent(`New request: ${q.title} (${q.qty} ${q.unit})`, "req"); }
  d.requests.forEach((q) => { if (q.status === "open" && q.quotes < 4 && minsSince(q.at) > 1 && q.id !== "q3" && q.id !== "q1" && rnd() < 0.05) { q.quotes++; pushEvent(`${pick(d.suppliers.filter((s) => s.status === "verified")).name} quoted ${q.code}`, "req"); } });
  emit();
}

export { AREAS, STATUS, calcFee };

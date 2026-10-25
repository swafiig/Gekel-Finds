"use client";
import { useState } from "react";
import { DialogShell, useOverlay } from "@/components/Overlay";
import { assignManual, broadcastMessage, changeRole, inviteMember, matchPayment, messageOrder } from "@/lib/actions";
import { ROLES } from "@/lib/constants";
import { money } from "@/lib/format";
import { getDb, inHub, rid, sup } from "@/lib/store";
import type { Order, RoleName, Unmatched } from "@/lib/types";
import { kmBetween } from "./helpers";

export function BroadcastDialog({ close }: { close: () => void }) {
  const { toast } = useOverlay(); const [to, setTo] = useState("All online riders"); const [m, setM] = useState(""); const [err, setErr] = useState(false);
  return (
    <DialogShell title="Broadcast a message" footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { if (!m.trim()) { setErr(true); return; } broadcastMessage(to, m.trim()); close(); toast(`Sent to ${to.toLowerCase()}`); }}>Send to everyone</button></>}>
      <div className="field"><label htmlFor="bw">Send to</label><select id="bw" className="input" value={to} onChange={(e) => setTo(e.target.value)}>{["All online riders", "All verified suppliers", "Riders in Eastleigh", "Riders in Kamukunji"].map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label htmlFor="bm">Message</label><textarea id="bm" className="input" value={m} onChange={(e) => { setM(e.target.value); setErr(false); }} placeholder="For example: heavy rain on Juja Road, allow extra time." />{err && <span className="errtxt">Write a message first.</span>}</div>
    </DialogShell>
  );
}

export function AssignDialog({ order, close, onDone }: { order: Order; close: () => void; onDone: (name: string) => void }) {
  const { toast } = useOverlay(); const s = sup(order.sid);
  const c = getDb().riders.filter((r) => r.status !== "suspended" && r.status !== "offline" && r.id !== order.rider).map((r) => ({ r, km: kmBetween(r, s) })).sort((a, b) => (a.r.job ? 1 : 0) - (b.r.job ? 1 : 0) || a.km - b.km);
  const first = c.find((x) => !x.r.job); const [pick, setPick] = useState(first?.r.id ?? "");
  return (
    <DialogShell title={`${order.rider ? "Reassign" : "Assign"} rider for ${order.code}`} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { if (!pick) { toast("Pick an available rider first", "bad"); return; } const r = assignManual(order, pick); close(); onDone(r.name); }}>Assign</button></>}>
      <p className="soft m-0">Pickup at <b>{s.name}</b>, {s.stall}. Sorted by availability, then distance.</p>
      {c.length ? (
        <div className="grid gap-2" role="radiogroup" aria-label="Riders">
          {c.map(({ r, km }) => (
            <label key={r.id} className={`card flat flex items-center gap-3 px-3 py-2.5 ${r.job ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
              <input type="radio" name="rpick" value={r.id} disabled={!!r.job} checked={pick === r.id} onChange={() => setPick(r.id)} className="accent-accent" />
              <span className="flex-1"><b>{r.name}</b><div className="muted">{r.vehicle} · {r.plate} · rating {r.rating}</div></span>
              <span className="num"><b>{km} km</b><div className="muted">{r.job ? "On a job" : "Free"}</div></span>
            </label>
          ))}
        </div>
      ) : <div className="empty"><b>No riders online</b>Message riders to go online.</div>}
    </DialogShell>
  );
}

export function MessageOrderDialog({ order, who, close }: { order: Order; who: "supplier" | "buyer"; close: () => void }) {
  const { toast } = useOverlay(); const name = who === "supplier" ? sup(order.sid).name : order.buyer;
  const T = who === "supplier" ? [`Please confirm the payment for ${order.code}.`, `Please pack ${order.code} now, the rider is close.`, `Is every item in stock for ${order.code}?`] : [`Please pay Till ${sup(order.sid).till} and enter the M-Pesa code for ${order.code}.`, "Your rider is on the way. Keep your 4-digit code ready.", "Your order is delayed. Sorry, we are on it."];
  const [t, setT] = useState(T[0]);
  return (
    <DialogShell title={`Message ${name}`} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { if (!t.trim()) return; messageOrder(order, who, t.trim()); close(); toast(`Sent to ${name}`); }}>Send message</button></>}>
      <div className="field"><label htmlFor="mt">Quick reply</label><select id="mt" className="input" value={T.includes(t) ? t : ""} onChange={(e) => e.target.value && setT(e.target.value)}>{T.map((x) => <option key={x}>{x}</option>)}</select></div>
      <div className="field"><label htmlFor="mb">Message</label><textarea id="mb" className="input" value={t} onChange={(e) => setT(e.target.value)} /><span className="hint">Sent by SMS and in the app. Replies show in the order chat.</span></div>
    </DialogShell>
  );
}

export function MatchDialog({ u, close }: { u: Unmatched; close: () => void }) {
  const { toast } = useOverlay();
  const c = getDb().orders.filter((o) => ["awaiting_payment", "payment_submitted", "paid"].includes(o.status)).sort((a, b) => Math.abs(a.fee - u.amount) - Math.abs(b.fee - u.amount)).slice(0, 6);
  const [pick, setPick] = useState(c[0]?.id ?? "");
  return (
    <DialogShell title={`Match ${u.ref} (${money(u.amount)})`} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { if (!pick) return; const o = matchPayment(u.ref, pick); close(); toast(`Matched to ${o.code}`); }}>Match payment</button></>}>
      <p className="soft m-0">Closest fees first.</p>
      <div className="grid gap-2">
        {c.map((o) => (
          <label key={o.id} className="card flat flex cursor-pointer items-center gap-3 px-3 py-2.5">
            <input type="radio" name="mpick" checked={pick === o.id} onChange={() => setPick(o.id)} className="accent-accent" />
            <span className="flex-1"><b>{o.code} · {o.buyer}</b><div className="muted">{sup(o.sid).name}</div></span>
            <span className="num"><b>{money(o.fee)}</b><div className="muted">{o.fee === u.amount ? "Exact" : "Off by " + money(Math.abs(o.fee - u.amount))}</div></span>
          </label>
        ))}
      </div>
    </DialogShell>
  );
}

export function InviteDialog({ close }: { close: () => void }) {
  const { toast } = useOverlay(); const [email, setEmail] = useState(""); const [role, setRole] = useState<RoleName>("Support"); const [err, setErr] = useState(false);
  return (
    <DialogShell title="Invite a team member" footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { const e = email.trim(); if (!/^\S+@\S+\.\S+$/.test(e)) { setErr(true); return; } inviteMember(e, role); close(); toast(`Invite sent to ${e}`); }}>Send invite</button></>}>
      <div className="field"><label htmlFor="ie">Work email</label><input id="ie" className={`input ${err ? "err" : ""}`} type="email" value={email} placeholder="name@gekel.co" onChange={(e) => { setEmail(e.target.value); setErr(false); }} />{err && <span className="errtxt">Enter a valid email address.</span>}</div>
      <div className="field"><label htmlFor="ir">Role</label><select id="ir" className="input" value={role} onChange={(e) => setRole(e.target.value as RoleName)}>{ROLES.filter((r) => r !== "Super admin").map((r) => <option key={r}>{r}</option>)}</select><span className="hint">You can change this later.</span></div>
    </DialogShell>
  );
}

export function RoleChangeDialog({ id, close }: { id: string; close: () => void }) {
  const { toast } = useOverlay(); const u = getDb().team.find((x) => x.id === id)!; const [r, setR] = useState<RoleName>(u.role);
  return (
    <DialogShell title={`Change role for ${u.name}`} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { if (u.id === "u1" && r !== "Super admin") { toast("At least one Super admin is needed", "bad"); return; } changeRole(id, r); close(); toast(`${u.name} is now ${r}`); }}>Save role</button></>}>
      <div className="field"><label htmlFor="nr">Role</label><select id="nr" className="input" value={r} onChange={(e) => setR(e.target.value as RoleName)}>{ROLES.map((x) => <option key={x}>{x}</option>)}</select></div>
    </DialogShell>
  );
}
export { inHub, rid };

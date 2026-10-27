"use client";
import { useState } from "react";
import { DialogShell, useOverlay } from "@/components/Overlay";
import { EditTable, Empty, Field, Kpi, PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { adjustPoints, savePoints } from "@/lib/actions2";
import { ageTxt, money } from "@/lib/format";
import { can, useDb } from "@/lib/store";
import type { PointsMember, PointsState } from "@/lib/types";

export default function Points() {
  const db = useDb()!; const { toast, dialog } = useOverlay(); const p = db.points; const [tab, setTab] = useState<"ledger" | "rules" | "people">("ledger"); const [draft, setDraft] = useState<PointsState>(() => JSON.parse(JSON.stringify(p))); const [q, setQ] = useState("");
  const out = p.issued - p.redeemed; const dirty = JSON.stringify({ ...draft, ledger: 0, members: 0 }) !== JSON.stringify({ ...p, ledger: 0, members: 0 }); const editable = can("config");
  const num = (k: "earnPer100" | "bonus" | "kshPerPoint" | "expiryDays", label: string, unit: string, hint: string) => (
    <Field id={"pt-" + k} label={label} hint={hint}><div className="flex items-center gap-2"><input id={"pt-" + k} className={`input num ${draft[k] !== p[k] ? "changed" : ""}`} style={{ maxWidth: 110 }} type="number" min={0} step="any" disabled={!editable} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: parseFloat(e.target.value) || 0 })} /><span className="muted">{unit}</span></div></Field>);
  const people = p.members.filter((m) => !q.trim() || `${m.name} ${m.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title="GEKEL Points" sub="Buyers earn points on delivered orders and spend them on delivery discounts and merchandise. This page shows what has been issued and what it would cost if everyone cashed in." />
      <div className="grid g4">
        <Kpi k="Points issued" v={p.issued.toLocaleString("en-KE")} d="All time" /><Kpi k="Points redeemed" v={p.redeemed.toLocaleString("en-KE")} d={`${Math.round((p.redeemed / p.issued) * 100)}% of issued`} tone="up" />
        <Kpi k="Points outstanding" v={out.toLocaleString("en-KE")} d="Held by buyers right now" /><Kpi k="Most GEKEL could owe" v={money(out * p.kshPerPoint)} d={`At KSh ${p.kshPerPoint} per point`} tone={out * p.kshPerPoint > 50000 ? "down" : "flat"} />
      </div>
      <section className="card"><Tabs<"ledger" | "rules" | "people"> tabs={[["ledger", "Recent activity"], ["rules", "Rules and rewards"], ["people", "Buyers", p.members.length]]} value={tab} onChange={setTab} />
        {tab === "ledger" && <div className="tw"><table className="t"><thead><tr><th>Buyer</th><th>What</th><th className="r">Points</th><th className="r">When</th></tr></thead><tbody>{p.ledger.map((l, i) => <tr key={i}><td><b>{l.who}</b></td><td>{l.note}</td><td className={`r num ${l.pts > 0 ? "ok-txt" : ""}`}>{l.pts > 0 ? "+" : ""}{l.pts}</td><td className="r num">{ageTxt(l.at)} ago</td></tr>)}</tbody></table></div>}
        {tab === "rules" && (<div className="p-[18px] grid gap-5">
          <div className="grid g2 gap-4">{num("earnPer100", "Points earned per KSh 100", "pts", "On the item value of delivered orders.")}{num("bonus", "Bonus per delivered order", "pts", "Flat extra, to reward coming back.")}{num("kshPerPoint", "Value of one point", "KSh", "Used to work out what points could cost GEKEL.")}{num("expiryDays", "Points expire after", "days", "Gives buyers a reason to use them.")}</div>
          <div><h3 className="mb-2 mt-0 text-sm font-bold">Rewards</h3><div className="card flat"><EditTable rows={draft.rewards} disabled={!editable} onChange={(r) => setDraft({ ...draft, rewards: r })} make={() => ({ id: "rw" + Date.now(), name: "New reward", cost: 100, stock: 0, active: false })} addLabel="Add reward"
            cols={[{ key: "name", label: "Reward", type: "text", width: 220 }, { key: "cost", label: "Costs", type: "number", unit: "pts" }, { key: "stock", label: "In stock", type: "number", hint: "9999 means unlimited (delivery discounts)" }, { key: "active", label: "Shown in app", type: "toggle" }]} /></div></div>
          {dirty && <div className="savebar"><span><b>Unsaved changes</b> <span className="opacity-70">Buyers see new values straight away.</span></span><span className="flex gap-2"><button className="btn sm ghost text-white" onClick={() => setDraft(JSON.parse(JSON.stringify(p)))}>Discard</button><PermButton perm="config" className="btn sm primary" onClick={() => { savePoints(draft); toast("Points rules saved"); }}>Save changes</PermButton></span></div>}
        </div>)}
        {tab === "people" && (<>
          <div className="toolbar"><input className="input" placeholder="Search name or phone" aria-label="Search buyers" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {people.length ? <div className="tw"><table className="t"><thead><tr><th>Buyer</th><th>Phone</th><th className="r">Balance</th><th className="r">Earned ever</th><th /></tr></thead><tbody>{people.map((m) => <tr key={m.phone}><td><b>{m.name}</b></td><td className="num">{m.phone}</td><td className="r num">{m.balance}</td><td className="r num">{m.lifetime}</td><td className="r"><PermButton perm="config" className="btn sm" onClick={() => dialog((close) => <Adjust m={m} close={close} />)}>Adjust</PermButton></td></tr>)}</tbody></table></div> : <Empty title="No one found">Try another name.</Empty>}
        </>)}
      </section>
    </>
  );
}
void Pill;

function Adjust({ m, close }: { m: PointsMember; close: () => void }) {
  const { toast } = useOverlay(); const [pts, setPts] = useState("50"); const [why, setWhy] = useState(""); const [err, setErr] = useState("");
  return (
    <DialogShell title={`Adjust points for ${m.name}`} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { const n = parseInt(pts, 10); if (!n) { setErr("Enter a number of points. Use a minus sign to take points away."); return; } if (!why.trim()) { setErr("Say why. It goes in the audit log."); return; } adjustPoints(m.name, n, why.trim()); close(); toast(`${m.name} now has ${m.balance} points`); }}>Apply</button></>}>
      <p className="soft m-0">Current balance: <b className="num">{m.balance}</b> points.</p>
      <Field id="ap" label="Points to add (or take away)"><input id="ap" className="input num" type="number" value={pts} onChange={(e) => { setPts(e.target.value); setErr(""); }} /></Field>
      <Field id="aw" label="Reason" error={err}><input id="aw" className="input" placeholder="Apology for a late delivery" value={why} onChange={(e) => { setWhy(e.target.value); setErr(""); }} /></Field>
    </DialogShell>
  );
}

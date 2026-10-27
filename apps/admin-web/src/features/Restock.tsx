"use client";
import { useState } from "react";
import { useOverlay } from "@/components/Overlay";
import { Bar, Empty, Kpi, PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { advanceRestock, assignRestockRider, remindShelf } from "@/lib/actions2";
import { ageTxt, money } from "@/lib/format";
import { can, rid, sup, useDb } from "@/lib/store";
import { RESTOCK_STAGES } from "@/lib/types";

export default function Restock() {
  const db = useDb()!; const { toast } = useOverlay(); const [tab, setTab] = useState<"jobs" | "shelves">("jobs");
  const live = db.restocks.filter((r) => r.stage < 3); const cap = db.shelves.reduce((a, s) => a + s.capacity, 0), used = db.shelves.reduce((a, s) => a + s.used, 0);
  return (
    <>
      <PageHead title="Restock and shelves" sub="Rent-a-Shelf: online sellers rent space at a GEKEL sorting centre. We buy from the wholesaler, collect, and stock their shelf so they can sell without a shop." />
      <div className="grid g4">
        <Kpi k="Restock jobs in progress" v={live.length} d={`${live.filter((r) => !r.rider && r.stage < 2).length} need a rider`} tone={live.some((r) => !r.rider && r.stage < 2) ? "down" : "flat"} />
        <Kpi k="Shelves rented" v={db.shelves.length} d={`${db.shelves.filter((s) => s.status === "overdue").length} overdue`} tone={db.shelves.some((s) => s.status === "overdue") ? "down" : "up"} />
        <Kpi k="Space used" v={`${cap ? Math.round((used / cap) * 100) : 0}%`} d={`${used} of ${cap} units`} />
        <Kpi k="Monthly rent" v={money(db.shelves.reduce((a, s) => a + s.rentMonthly, 0))} d={`Standard shelf ${money(db.pricing.shelfRent)}`} tone="up" />
      </div>
      <section className="card"><Tabs<"jobs" | "shelves"> tabs={[["jobs", "Restock jobs", live.length], ["shelves", "Shelves", db.shelves.length]]} value={tab} onChange={setTab} />
        {tab === "jobs" ? (db.restocks.length ? <div className="tw"><table className="t"><thead><tr><th>Job</th><th>Seller</th><th>From</th><th className="r">Units</th><th>Stage</th><th>Rider</th><th className="r">Age</th><th /></tr></thead>
          <tbody>{db.restocks.map((j) => (
            <tr key={j.id}><td><span className="two"><b>{j.product}</b><small className="num">{j.code}</small></span></td><td>{j.seller}</td><td>{sup(j.wholesaler).name}</td><td className="r num">{j.qty}</td><td><Pill tone={j.stage === 3 ? "ok" : j.stage ? "acc" : "warn"}>{RESTOCK_STAGES[j.stage]}</Pill></td>
              <td>{j.rider ? rid(j.rider).name : j.stage < 2 ? <select className="input" style={{ minWidth: 150 }} aria-label="Assign rider" value="" onChange={(e) => { if (!can("orders")) { toast("Your role cannot assign riders.", "bad"); return; } if (e.target.value) { assignRestockRider(j, e.target.value); toast("Rider assigned"); } }}><option value="">Assign</option>{db.riders.filter((r) => r.status === "online").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select> : "-"}</td>
              <td className="r num">{ageTxt(j.createdAt)}</td><td className="r">{j.stage < 3 && <PermButton perm="orders" className="btn sm" onClick={() => { advanceRestock(j); toast(`${j.code}: ${RESTOCK_STAGES[j.stage]}`); }}>{["Rider collecting", "At sorting centre", "Stocked on shelf"][j.stage]}</PermButton>}</td></tr>))}</tbody></table></div> : <Empty title="No restock jobs">They appear when a seller asks to restock from the app.</Empty>)
        : <div className="grid g2 p-[18px]">{db.shelves.map((s) => (
          <div key={s.id} className="card flat p-4 grid gap-2.5"><div className="flex justify-between gap-2"><div><b>{s.seller}</b><div className="muted">{s.hub} sorting centre</div></div><Pill tone={s.status === "overdue" ? "bad" : "ok"}>{s.status === "overdue" ? "Rent overdue" : "Active"}</Pill></div>
            <Bar pct={(s.used / s.capacity) * 100} tone={s.used >= s.capacity ? "bad" : "acc"} /><span className="muted num">{s.used} of {s.capacity} units used</span>
            <div className="kv"><div><small>Rent</small><b className="num">{money(s.rentMonthly)} a month</b></div><div><small>Paid until</small><b>{new Date(s.paidUntil).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</b></div></div>
            {s.status === "overdue" && <PermButton perm="orders" className="btn sm" style={{ justifySelf: "start" }} onClick={() => { remindShelf(s); toast("Reminder sent by SMS"); }}>Send rent reminder</PermButton>}</div>))}</div>}
      </section>
    </>
  );
}

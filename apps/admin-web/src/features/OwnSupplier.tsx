"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOpenId } from "@/components/hooks";
import { Drawer, useOverlay } from "@/components/Overlay";
import { Banner, Empty, Kpi, PageHead, PermButton, Pill, Stages, Tabs } from "@/components/ui";
import { advanceOwn, assignOwn, cancelOwn } from "@/lib/actions2";
import { ageTxt, money } from "@/lib/format";
import { can, inHub, rid, useDb } from "@/lib/store";
import { OWN_STAGES, type OwnJob } from "@/lib/types";

export default function OwnSupplier() {
  const db = useDb()!; const [openId, setOpen, close] = useOpenId(); const [tab, setTab] = useState<"live" | "done">("live");
  const all = db.ownJobs.filter(inHub); const live = all.filter((j) => !j.cancelled && j.stage < 3); const done = all.filter((j) => j.cancelled || j.stage === 3);
  const rows = tab === "live" ? live : done; const job = db.ownJobs.find((j) => j.id === openId) ?? null;
  const buyers = new Map<string, number>(); all.forEach((j) => buyers.set(j.buyer, (buyers.get(j.buyer) ?? 0) + 1)); const repeat = [...buyers.values()].filter((n) => n > 1).length;
  return (
    <>
      <PageHead title="Own-supplier jobs" sub="Buyers who already have a supplier and only want GEKEL to collect and deliver. GEKEL moves the parcel, the buyer deals with their supplier." />
      <Banner icon="shield" warn>These suppliers are not verified by GEKEL. A packing photo and seal are still recorded, but GEKEL cannot rule on what was inside. The buyer was told this in the app.</Banner>
      <div className="grid g4">
        <Kpi k="Jobs in progress" v={live.length} d={`${live.filter((j) => !j.rider).length} need a rider`} tone={live.some((j) => !j.rider) ? "down" : "flat"} />
        <Kpi k="Logistics fees (all time)" v={money(all.filter((j) => !j.cancelled).reduce((a, j) => a + j.fee, 0))} d={`Pickup fee ${money(db.pricing.ownSupplierFee)} included`} />
        <Kpi k="Buyers using this" v={buyers.size} d={`${repeat} come back`} tone="up" />
        <Kpi k="Goods moved" v={money(all.filter((j) => !j.cancelled).reduce((a, j) => a + j.value, 0))} d="Paid by buyers directly, not by GEKEL" />
      </div>
      <section className="card"><Tabs tabs={[["live", "In progress", live.length], ["done", "Finished", done.length]]} value={tab} onChange={setTab} />
        {rows.length ? <div className="tw"><table className="t"><thead><tr><th>Job</th><th>Buyer</th><th>Their supplier</th><th>Drop-off</th><th>Stage</th><th>Rider</th><th className="r">Goods</th><th className="r">Age</th></tr></thead>
          <tbody>{rows.map((j) => (
            <tr key={j.id} data-row onClick={() => setOpen(j.id)}><td><span className="two"><b>{j.items}</b><small className="num">{j.code}</small></span></td><td>{j.buyer}</td><td><span className="two"><span>{j.sup.name}</span><small>{j.sup.location}</small></span></td><td>{j.area}</td>
              <td>{j.cancelled ? <Pill tone="bad">Cancelled</Pill> : <Pill tone={j.stage === 3 ? "ok" : j.stage ? "acc" : "warn"}>{OWN_STAGES[j.stage]}</Pill>}</td><td>{j.rider ? rid(j.rider).name : <span className="age warm">None</span>}</td><td className="r num">{money(j.value)}</td><td className="r num">{ageTxt(j.createdAt)}</td></tr>))}</tbody></table></div> : <Empty title="Nothing here">No jobs in this list.</Empty>}
      </section>
      <OwnDrawer j={job} onClose={close} />
    </>
  );
}

function OwnDrawer({ j, onClose }: { j: OwnJob | null; onClose: () => void }) {
  const { toast, confirm } = useOverlay(); const db = useDb()!;
  if (!j) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const free = db.riders.filter((r) => r.status !== "suspended" && r.status !== "offline" && r.hub === j.hub);
  return (
    <Drawer open onClose={onClose} title={j.items} sub={<><span className="muted num">{j.code}</span>{j.cancelled ? <Pill tone="bad">Cancelled</Pill> : <Pill tone="acc">{OWN_STAGES[j.stage]}</Pill>}</>}
      footer={j.cancelled || j.stage === 3 ? null : (<>
        {j.stage >= 1 && j.stage < 3 && <PermButton perm="sourcing" className="btn primary" onClick={() => { advanceOwn(j); toast(`${j.code}: ${OWN_STAGES[j.stage]}`); }}>{j.stage === 1 ? "Collected from supplier" : "Mark delivered"}</PermButton>}
        <PermButton perm="sourcing" className="btn danger" onClick={() => confirm({ title: `Cancel ${j.code}?`, text: "The buyer is told and the rider is released.", label: "Cancel job", danger: true, field: { label: "Reason", placeholder: "Supplier closed, buyer cancelled..." }, onOk: (r) => { cancelOwn(j, r); toast("Cancelled"); } })}>Cancel job</PermButton></>)}>
      <div className="sect"><h3>Buyer</h3><div className="kv"><div><small>Name</small><b>{j.buyer}</b></div><div><small>Phone</small><b className="num">{j.phone}</b></div><div><small>Drop-off</small><b>{j.area}</b></div><div><small>Logistics fee</small><b className="num">{money(j.fee)}</b></div></div></div>
      <div className="sect"><h3>Their supplier</h3><div className="kv"><div><small>Name</small><b>{j.sup.name}</b></div><div><small>Phone</small><b className="num">{j.sup.phone}</b></div><div><small>Where</small><b>{j.sup.location}</b></div><div><small>Pays by</small><b>{j.paidDirect ? "Cash on collection" : j.sup.till ? `Buyer paid Till ${j.sup.till}` : "Buyer arranges"}</b></div></div>
        <div className="flex gap-2 flex-wrap"><a className="btn sm" href={`tel:${j.sup.phone.replace(/\s/g, "")}`}><Icon name="phone" small /> Call supplier</a>{j.paidDirect && <Pill tone="warn">Rider may need cash: {money(j.value)}</Pill>}</div></div>
      <div className="sect"><h3>Rider</h3>
        <select className="input" style={{ maxWidth: 320 }} aria-label="Assign rider" disabled={j.cancelled || j.stage > 2} value={j.rider ?? ""} onChange={(e) => { if (!can("sourcing")) { toast("Your role cannot assign riders.", "bad"); return; } if (e.target.value) { const r = assignOwn(j, e.target.value); toast(`${r.name} assigned`); } }}>
          <option value="">Not assigned</option>{free.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.vehicle}{r.job ? " (on a job)" : ""}</option>)}</select></div>
      <div className="sect"><h3>Progress</h3><Stages stages={OWN_STAGES} at={j.stage} closed={j.cancelled} /></div>
      {j.stage === 3 && !j.cancelled && <div className="sect"><h3>Next step</h3><p className="soft m-0">If {j.buyer} keeps using {j.sup.name}, invite them to join GEKEL as a verified supplier so their items show up in the app.</p></div>}
    </Drawer>
  );
}

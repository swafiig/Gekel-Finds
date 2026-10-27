"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOpenId } from "@/components/hooks";
import { Drawer, useOverlay } from "@/components/Overlay";
import { Empty, Kpi, PageHead, PermButton, Pill, Stages, Tabs } from "@/components/ui";
import { advanceErrand, assignRunner, cancelErrand, setErrandPrice } from "@/lib/actions2";
import { ageTxt, money } from "@/lib/format";
import { can, useDb } from "@/lib/store";
import { ERRAND_STAGES, type Errand } from "@/lib/types";

export default function Errands() {
  const db = useDb()!; const [openId, setOpen, close] = useOpenId(); const [tab, setTab] = useState<"board" | "list">("board");
  const L = db.errands; const live = L.filter((e) => !e.cancelled && e.stage < 3); const e0 = L.find((e) => e.id === openId) ?? null;
  const rev = L.filter((e) => !e.cancelled && e.stage === 3).reduce((a, e) => a + e.price, 0);
  return (
    <>
      <PageHead title="Errands" sub="Odd jobs buyers ask for besides buying: queueing, paying a bill, collecting documents. A runner does the job and the buyer follows it in the app." />
      <div className="grid g4">
        <Kpi k="In progress" v={live.length} d={`${live.filter((e) => e.stage === 0).length} waiting for a runner`} tone={live.some((e) => e.stage === 0) ? "down" : "flat"} />
        <Kpi k="Done today" v={L.filter((e) => e.stage === 3 && !e.cancelled).length} d={`${money(rev)} earned`} tone="up" />
        <Kpi k="Most asked" v={mostAsked(L)} d="Across all errands" />
        <Kpi k="Average price" v={money(L.length ? L.reduce((a, e) => a + e.price, 0) / L.length : 0)} d="Edit prices under Pricing and rules" />
      </div>
      <section className="card"><Tabs<"board" | "list"> tabs={[["board", "Board"], ["list", "List", L.length]]} value={tab} onChange={setTab} />
        {tab === "board" ? (
          <div className="board c4">{ERRAND_STAGES.map((s, i) => { const R = L.filter((e) => !e.cancelled && e.stage === i); return (
            <div key={s} className="col"><h4>{s}<span className="n">{R.length}</span></h4>
              {R.map((e) => (<button key={e.id} className="kc" onClick={() => setOpen(e.id)}><div className="row"><span className="muted num">{e.code}</span><span className={`age ${i === 0 && Date.now() - e.createdAt > 15 * 60000 ? "hot" : ""}`}>{ageTxt(e.createdAt)}</span></div><b>{e.type}</b><span className="soft">{e.details.length > 70 ? e.details.slice(0, 70) + "..." : e.details}</span><div className="row muted"><span>{e.buyer} · {e.area}</span><span className="num">{e.price ? money(e.price) : "Quote"}</span></div></button>))}
              {!R.length && <div className="muted px-1 text-[13px]">Nothing here</div>}</div>); })}</div>
        ) : L.length ? (
          <div className="tw"><table className="t"><thead><tr><th>Errand</th><th>Buyer</th><th>Area</th><th>Stage</th><th>Runner</th><th className="r">Price</th><th className="r">Age</th></tr></thead>
            <tbody>{L.map((e) => <tr key={e.id} data-row onClick={() => setOpen(e.id)}><td><span className="two"><b>{e.type}</b><small className="num">{e.code}</small></span></td><td>{e.buyer}</td><td>{e.area}</td><td>{e.cancelled ? <Pill tone="bad">Cancelled</Pill> : <Pill tone={e.stage === 3 ? "ok" : e.stage ? "acc" : "warn"}>{ERRAND_STAGES[e.stage]}</Pill>}</td><td>{e.runner ?? <span className="muted">None</span>}</td><td className="r num">{e.price ? money(e.price) : "Quote"}</td><td className="r num">{ageTxt(e.createdAt)}</td></tr>)}</tbody></table></div>
        ) : <Empty title="No errands yet">They appear when buyers use Errands in the app.</Empty>}
      </section>
      <ErrandDrawer e={e0} onClose={close} />
    </>
  );
}
function mostAsked(L: Errand[]) { const m = new Map<string, number>(); L.forEach((e) => m.set(e.type, (m.get(e.type) ?? 0) + 1)); const t = [...m.entries()].sort((a, b) => b[1] - a[1])[0]; return t ? t[0].split(" ").slice(0, 2).join(" ") : "-"; }

function ErrandDrawer({ e, onClose }: { e: Errand | null; onClose: () => void }) {
  const { toast, confirm } = useOverlay(); const db = useDb()!; const [price, setPrice] = useState("");
  if (!e) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const runners = [...new Set([...db.riders.filter((r) => r.status !== "suspended").map((r) => r.name), ...db.errands.map((x) => x.runner).filter(Boolean) as string[]])];
  return (
    <Drawer open onClose={onClose} title={e.type} sub={<><span className="muted num">{e.code}</span>{e.cancelled ? <Pill tone="bad">Cancelled</Pill> : <Pill tone="acc">{ERRAND_STAGES[e.stage]}</Pill>}</>}
      footer={e.cancelled || e.stage === 3 ? null : (<>
        {e.stage >= 1 && <PermButton perm="orders" className="btn primary" onClick={() => { advanceErrand(e); toast(`${e.code}: ${ERRAND_STAGES[e.stage]}`); }}>{e.stage === 1 ? "Runner started" : "Mark completed"}</PermButton>}
        <PermButton perm="orders" className="btn danger" onClick={() => confirm({ title: `Cancel ${e.code}?`, text: "The buyer is told.", label: "Cancel errand", danger: true, field: { label: "Reason", placeholder: "Buyer cancelled, cannot be done..." }, onOk: (r) => { cancelErrand(e, r); toast("Cancelled"); } })}>Cancel</PermButton></>)}>
      <div className="sect"><h3>Details</h3><p className="m-0">{e.details}</p><div className="kv"><div><small>Buyer</small><b>{e.buyer}</b></div><div><small>Phone</small><b className="num">{e.phone}</b></div><div><small>Area</small><b>{e.area}</b></div><div><small>Price</small><b className="num">{e.price ? money(e.price) : "Not quoted yet"}</b></div></div>
        <a className="btn sm" style={{ justifySelf: "start" }} href={`tel:${e.phone.replace(/\s/g, "")}`}><Icon name="phone" small /> Call buyer</a></div>
      {!e.price && !e.cancelled && <div className="sect"><h3>Quote the price</h3><div className="flex gap-2"><input className="input num" style={{ maxWidth: 160 }} type="number" min={0} placeholder="KSh" aria-label="Price" value={price} onChange={(x) => setPrice(x.target.value)} /><PermButton perm="orders" onClick={() => { const p = parseFloat(price); if (p > 0) { setErrandPrice(e, p); toast("Price sent to buyer"); } }}>Send quote</PermButton></div></div>}
      <div className="sect"><h3>Runner</h3><select className="input" style={{ maxWidth: 320 }} aria-label="Assign runner" disabled={e.cancelled || e.stage > 1} value={e.runner ?? ""} onChange={(x) => { if (!can("orders")) { toast("Your role cannot assign runners.", "bad"); return; } if (x.target.value) { assignRunner(e, x.target.value); toast(`${x.target.value} assigned`); } }}><option value="">Not assigned</option>{runners.map((r) => <option key={r}>{r}</option>)}</select></div>
      <div className="sect"><h3>Progress</h3><Stages stages={ERRAND_STAGES} at={e.stage} closed={e.cancelled} /></div>
    </Drawer>
  );
}

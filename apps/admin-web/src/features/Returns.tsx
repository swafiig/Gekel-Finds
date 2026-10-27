"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOverlay } from "@/components/Overlay";
import { Empty, PermButton, Pill, Tabs } from "@/components/ui";
import { setReturn } from "@/lib/actions2";
import { ageTxt, clock, money } from "@/lib/format";
import { sup, useDb } from "@/lib/store";
import { RETURN_LABEL, type ReturnReq, type ReturnState } from "@/lib/types";

const tone = (s: ReturnState) => (s === "refunded" ? "ok" : s === "declined" ? "bad" : s === "requested" ? "warn" : "acc") as "ok" | "bad" | "warn" | "acc";
const FLOW: ReturnState[] = ["requested", "discussing", "approved", "pickup_booked", "refunded"];

export default function Returns() {
  const db = useDb()!; const sp = useSearchParams(); const param = sp.get("id"); const [tab, setTab] = useState<"open" | "done">("open"); const [sel, setSel] = useState<string | null>(param);
  useEffect(() => { if (param) { const r = db.returns.find((x) => x.id === param); if (r) { setTab(["refunded", "declined"].includes(r.status) ? "done" : "open"); setSel(param); } } }, [param]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = db.returns.filter((r) => !["refunded", "declined"].includes(r.status)); const done = db.returns.filter((r) => ["refunded", "declined"].includes(r.status));
  const rows = tab === "open" ? open : done; const r = rows.find((x) => x.id === sel) ?? rows[0];
  return (
    <div className="split">
      <section className="card"><Tabs tabs={[["open", "Open", open.length], ["done", "Closed", done.length]]} value={tab} onChange={(t) => { setTab(t); setSel(null); }} />
        <div className="queue">{rows.length ? rows.map((x) => (
          <button key={x.id} className="qi" aria-current={r?.id === x.id} onClick={() => setSel(x.id)}>
            <div className="row"><b>{x.item}</b><Pill tone={tone(x.status)}>{RETURN_LABEL[x.status]}</Pill></div><div className="row"><span className="muted">{x.code} · {x.buyer}</span><span className="muted">{ageTxt(x.at)}</span></div><span className="muted num">{money(x.amount)} · {sup(x.sid).name}</span></button>
        )) : <Empty title="Nothing here">No returns in this list.</Empty>}</div></section>
      <section className="card detail">{r ? <Case r={r} /> : <Empty title="Pick a return">The reason, photo and next steps appear here.</Empty>}</section>
    </div>
  );
}

function Case({ r }: { r: ReturnReq }) {
  const { toast, confirm } = useOverlay(); const [note, setNote] = useState(""); const s = sup(r.sid);
  const step = FLOW.indexOf(r.status); const act = (st: ReturnState, payer?: "buyer" | "supplier", msg = "") => { setReturn(r, st, msg || note, payer); setNote(""); toast(`${r.code}: ${RETURN_LABEL[st].toLowerCase()}`); };
  return (<>
    <div className="sect"><div className="flex justify-between gap-3 flex-wrap items-start"><div><h2 className="big">{r.item}</h2><span className="muted">{r.code} · {s.name} · {money(r.amount)}</span></div><Pill tone={tone(r.status)}>{RETURN_LABEL[r.status]}</Pill></div></div>
    <div className="sect"><h3>Buyer says</h3><p className="m-0">"{r.reason}"</p><div className="kv"><div><small>Buyer</small><b>{r.buyer}</b></div><div><small>Asked</small><b>{ageTxt(r.at)} ago</b></div><div><small>Photo</small><b>{r.hasPhoto ? "Attached by buyer" : "None"}</b></div><div><small>Return delivery paid by</small><b>{r.payer ?? "Not decided"}</b></div></div></div>
    <div className="sect"><h3>How a return works</h3><p className="soft m-0">The buyer and the supplier talk first. If the supplier agrees, we book a pickup. Whoever caused the problem pays the return delivery. The supplier refunds the buyer directly to their M-Pesa.</p>
      <div className="steps">{FLOW.map((f, i) => <span key={f} className={`stp ${r.status === f ? "cur" : i < step ? "done" : ""}`}>{RETURN_LABEL[f]}</span>)}</div></div>
    {!["refunded", "declined"].includes(r.status) && <div className="sect"><h3>Next step</h3>
      <div className="field"><label htmlFor="rn">Note for the record (optional)</label><input id="rn" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was agreed" /></div>
      <div className="flex gap-2 flex-wrap">
        {r.status === "requested" && <PermButton perm="disputes" className="btn primary" onClick={() => act("discussing", undefined, `Asked ${s.name} to respond`)}>Ask supplier to respond</PermButton>}
        {(r.status === "requested" || r.status === "discussing") && <><PermButton perm="disputes" className="btn" onClick={() => act("approved")}>Approve return</PermButton><PermButton perm="disputes" className="btn danger" onClick={() => confirm({ title: "Decline this return?", text: "The buyer is told why. They can reply to ask for a review.", label: "Decline", danger: true, field: { label: "Reason the buyer will see", placeholder: "Used and washed, outside the 48 hour window" }, onOk: (m) => act("declined", undefined, m) })}>Decline</PermButton></>}
        {r.status === "approved" && <><PermButton perm="disputes" className="btn primary" onClick={() => act("pickup_booked", "supplier", "Supplier's fault")}>Book pickup, supplier pays</PermButton><PermButton perm="disputes" className="btn" onClick={() => act("pickup_booked", "buyer", "Buyer's choice")}>Book pickup, buyer pays</PermButton></>}
        {r.status === "pickup_booked" && <PermButton perm="payments" className="btn primary" onClick={() => act("refunded", undefined, `${s.name} refunded ${money(r.amount)}`)}>Supplier refunded the buyer</PermButton>}
      </div></div>}
    <div className="sect"><h3>History</h3>{r.notes.length ? <div className="grid gap-2">{[...r.notes].reverse().map((n, i) => <div key={i} className="note"><small>{n.who} · {clock(n.at)}</small>{n.t}</div>)}</div> : <span className="muted">Nothing yet.</span>}</div>
  </>);
}

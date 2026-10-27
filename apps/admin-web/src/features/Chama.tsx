"use client";
import { useOpenId } from "@/components/hooks";
import { Drawer, useOverlay } from "@/components/Overlay";
import { Bar, Empty, Kpi, PageHead, PermButton, Pill } from "@/components/ui";
import { nudgeChama, setChama } from "@/lib/actions2";
import { ageTxt, money } from "@/lib/format";
import { inHub, useDb } from "@/lib/store";
import type { Chama } from "@/lib/types";

const have = (c: Chama) => c.members.reduce((a, m) => a + m.qty, 0);
const tone = (s: Chama["status"]) => (s === "ready" ? "acc" : s === "ordered" ? "ok" : s === "cancelled" ? "bad" : "warn") as "acc" | "ok" | "bad" | "warn";
const label: Record<Chama["status"], string> = { collecting: "Collecting", ready: "Ready to order", ordered: "Ordered", cancelled: "Cancelled" };

export default function ChamaPage() {
  const db = useDb()!; const [openId, setOpen, close] = useOpenId(); const L = db.chamas.filter(inHub); const c = db.chamas.find((x) => x.id === openId) ?? null;
  const live = L.filter((x) => x.status === "collecting" || x.status === "ready");
  return (
    <>
      <PageHead title="Chama Buy" sub="Neighbours and friends pool one order to reach the wholesale price. One leader starts it, others join with their phone number, and it goes to dispatch when the target is reached." />
      <div className="grid g4">
        <Kpi k="Groups collecting" v={L.filter((x) => x.status === "collecting").length} d={`${live.reduce((a, x) => a + Math.max(0, x.targetQty - have(x)), 0)} units still needed`} />
        <Kpi k="Ready to order" v={L.filter((x) => x.status === "ready").length} d="Release them to dispatch" tone={L.some((x) => x.status === "ready") ? "down" : "flat"} />
        <Kpi k="Ordered" v={L.filter((x) => x.status === "ordered").length} d="Delivered as one drop" tone="up" />
        <Kpi k="Unpaid members" v={live.reduce((a, x) => a + x.members.filter((m) => !m.paid).length, 0)} d="Only matters for pay-first groups" />
      </div>
      <section className="card">{L.length ? <div className="tw"><table className="t"><thead><tr><th>Group</th><th>Leader</th><th>Pays</th><th style={{ width: "22%" }}>Filled</th><th>Members</th><th>Status</th><th className="r">Started</th></tr></thead>
        <tbody>{L.map((x) => (
          <tr key={x.id} data-row onClick={() => setOpen(x.id)}><td><span className="two"><b>{x.product}</b><small className="num">{x.code} · {money(x.unitPrice)} each</small></span></td><td>{x.leader}<div className="muted">{x.area}</div></td><td>{x.payMode === "pre" ? "Everyone first" : "One person on delivery"}</td>
            <td><div className="flex items-center gap-2"><div className="flex-1"><Bar pct={(have(x) / x.targetQty) * 100} tone={have(x) >= x.targetQty ? "ok" : "acc"} /></div><span className="num">{have(x)}/{x.targetQty}</span></div></td>
            <td className="num">{x.members.length} <span className="muted">({x.members.filter((m) => m.paid).length} paid)</span></td><td><Pill tone={tone(x.status)}>{label[x.status]}</Pill></td><td className="r num">{ageTxt(x.createdAt)}</td></tr>))}</tbody></table></div>
        : <Empty title="No group orders yet">They appear when buyers tap Chama Buy on an item with a wholesale price.</Empty>}</section>
      <ChamaDrawer c={c} onClose={close} />
    </>
  );
}

function ChamaDrawer({ c, onClose }: { c: Chama | null; onClose: () => void }) {
  const { toast, confirm } = useOverlay();
  if (!c) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const unpaid = c.members.filter((m) => !m.paid);
  return (
    <Drawer open onClose={onClose} title={c.product} sub={<><span className="muted num">{c.code}</span><Pill tone={tone(c.status)}>{label[c.status]}</Pill></>}
      footer={c.status === "ordered" || c.status === "cancelled" ? null : (<>
        {c.status === "ready" && <PermButton perm="orders" className="btn primary" onClick={() => confirm({ title: "Release to dispatch?", text: `${have(c)} units for ${c.members.length} people go to the supplier as one order.${c.payMode === "pre" && unpaid.length ? ` ${unpaid.length} member${unpaid.length > 1 ? "s have" : " has"} not paid yet.` : ""}`, label: "Release", onOk: () => { setChama(c, "ordered", `${have(c)} units`); toast("Sent to the supplier as one order"); } })}>Release to dispatch</PermButton>}
        {unpaid.length > 0 && c.payMode === "pre" && <PermButton perm="orders" onClick={() => { const n = nudgeChama(c); toast(`${n} reminders sent by SMS`); }}>Remind {unpaid.length} unpaid</PermButton>}
        <PermButton perm="orders" className="btn danger" onClick={() => confirm({ title: "Cancel this group order?", text: "Members who already paid are refunded to M-Pesa.", label: "Cancel group", danger: true, field: { label: "Reason", placeholder: "Not enough people joined" }, onOk: (r) => { setChama(c, "cancelled", r); toast("Cancelled"); } })}>Cancel group</PermButton></>)}>
      <div className="sect"><div className="kv"><div><small>Leader</small><b>{c.leader}</b></div><div><small>Delivery area</small><b>{c.area}</b></div><div><small>Unit price</small><b className="num">{money(c.unitPrice)} (wholesale)</b></div><div><small>Payment</small><b>{c.payMode === "pre" ? "Everyone pays before the order is placed" : "One person pays on delivery and collects from the others"}</b></div></div><Bar pct={(have(c) / c.targetQty) * 100} tone={have(c) >= c.targetQty ? "ok" : "acc"} /><span className="muted">{have(c)} of {c.targetQty} units joined</span></div>
      <div className="sect"><h3>Members</h3><div className="tw"><table className="t sm"><thead><tr><th>Name</th><th>Phone</th><th className="r">Units</th><th className="r">Share</th><th>Paid</th></tr></thead>
        <tbody>{c.members.map((m) => <tr key={m.phone + m.name}><td>{m.name}</td><td className="num">{m.phone}</td><td className="r num">{m.qty}</td><td className="r num">{money(m.qty * c.unitPrice)}</td><td>{m.paid ? <Pill tone="ok">Paid</Pill> : <Pill tone={c.payMode === "post" ? "" : "warn"}>{c.payMode === "post" ? "On delivery" : "Not yet"}</Pill>}</td></tr>)}</tbody></table></div></div>
    </Drawer>
  );
}

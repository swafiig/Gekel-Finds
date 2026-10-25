"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Drawer, useOverlay } from "@/components/Overlay";
import { Chips, Empty, PageHead, PermButton, StatusPill } from "@/components/ui";
import { AssignDialog, MessageOrderDialog } from "./dialogs";
import { NoProof, ProofFrame } from "./ProofFrame";
import { needsAction } from "./helpers";
import { cancelOrder, nudgeMany, nudgeSupplier, openDispute } from "@/lib/actions";
import { FLOW, STATUS } from "@/lib/constants";
import { ageCls, ageTxt, clock, csvCell, minsSince, money } from "@/lib/format";
import { inHub, ord, rid, since, sup, useDb } from "@/lib/store";
import type { Order } from "@/lib/types";

type Filter = "all" | "action" | "active" | "done" | "problem";
const LABELS: Record<Filter, string> = { all: "All", action: "Needs action", active: "In flight", done: "Delivered", problem: "Problems" };

function csvOf(rows: Order[]) {
  return [["Order", "Buyer", "Area", "Supplier", "Items", "Item value", "GEKEL fee", "Status", "M-Pesa code"].map(csvCell).join(","), ...rows.map((o) => [o.code, o.buyer, o.area, sup(o.sid).name, o.lines.map((l) => `${l.q}x ${l.n}`).join("; "), o.itemsTotal, o.fee, STATUS[o.status].label, o.mpesa ?? ""].map(csvCell).join(","))].join("\n");
}
export async function copyText(text: string, ok: string, toast: (m: string, t?: "" | "bad") => void) {
  try { await navigator.clipboard.writeText(text); toast(ok); } catch { toast("Copy blocked. Select the text and copy manually.", "bad"); }
}

export default function Orders() {
  const db = useDb()!; const router = useRouter(); const path = usePathname(); const sp = useSearchParams(); const { toast } = useOverlay();
  const [status, setStatus] = useState<Filter>("all"); const [q, setQ] = useState(""); const [sel, setSel] = useState<Set<string>>(new Set());
  const O = db.orders.filter(inHub);
  const counts: Record<Filter, number> = { all: O.length, action: O.filter(needsAction).length, active: O.filter((o) => !["delivered", "cancelled"].includes(o.status)).length, done: O.filter((o) => o.status === "delivered").length, problem: O.filter((o) => ["cancelled", "disputed"].includes(o.status)).length };
  const needle = q.toLowerCase();
  const rows = O.filter((o) => {
    if (status === "action" && !needsAction(o)) return false; if (status === "active" && ["delivered", "cancelled"].includes(o.status)) return false;
    if (status === "done" && o.status !== "delivered") return false; if (status === "problem" && !["cancelled", "disputed"].includes(o.status)) return false;
    return !needle || `${o.code} ${o.buyer} ${sup(o.sid).name} ${o.mpesa ?? ""} ${o.area}`.toLowerCase().includes(needle);
  });
  const shown = rows.slice(0, 80); const allSel = shown.length > 0 && shown.every((o) => sel.has(o.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const openId = sp.get("open"); const open = openId ? ord(openId) : undefined;
  const openOrder = (id: string) => router.replace(`${path}?open=${id}`, { scroll: false }); const closeOrder = () => router.replace(path, { scroll: false });
  const chosen = db.orders.filter((o) => sel.has(o.id));
  return (
    <>
      <PageHead title="Orders" sub="Every order from accepted quote to doorstep. Click a row for proof photos, payments and dispatch.">
        <button className="btn" onClick={() => copyText(csvOf(rows), `Copied ${rows.length} orders as CSV. Paste into a sheet.`, toast)}><Icon name="copy" small /> Copy shown as CSV</button>
      </PageHead>
      <section className="card">
        <div className="toolbar">
          <Chips<Filter> items={(Object.keys(LABELS) as Filter[]).map((k) => [k, LABELS[k], counts[k]])} value={status} onChange={setStatus} />
          <input className="input ml-auto" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, buyer, M-Pesa code" aria-label="Search orders" />
        </div>
        {sel.size > 0 && (
          <div className="toolbar bg-accent-soft"><b>{sel.size} selected</b>
            <button className="btn sm" onClick={() => copyText(csvOf(chosen), `Copied ${chosen.length} orders as CSV`, toast)}><Icon name="copy" small /> Copy as CSV</button>
            <PermButton perm="orders" className="btn sm" onClick={() => { nudgeMany(chosen); toast(`Reminder sent to ${new Set(chosen.map((o) => o.sid)).size} suppliers`); setSel(new Set()); }}><Icon name="msg" small /> Nudge suppliers</PermButton>
            <button className="btn sm ghost" onClick={() => setSel(new Set())}>Clear</button>
          </div>
        )}
        {shown.length === 0 ? <Empty title="No orders match">Change the filter or clear the search.</Empty> : (
          <div className="tw"><table className="t"><thead><tr><th style={{ width: 36 }}><input type="checkbox" aria-label="Select all shown" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(shown.map((o) => o.id)))} /></th><th>Order</th><th>Buyer</th><th>Supplier</th><th>Items</th><th className="r">Value</th><th>Status</th><th>Rider</th><th className="r">In this step</th></tr></thead>
            <tbody>{shown.map((o) => {
              const m = minsSince(since(o)); const r = o.rider ? rid(o.rider) : null; const end = ["delivered", "cancelled"].includes(o.status);
              return (
                <tr key={o.id} data-row className={sel.has(o.id) ? "sel" : ""} onClick={() => openOrder(o.id)}>
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${o.code}`} checked={sel.has(o.id)} onChange={() => toggle(o.id)} /></td>
                  <td><span className="two"><span className="id">{o.code}</span><small>{ageTxt(o.createdAt)} ago</small></span></td>
                  <td><span className="two"><span>{o.buyer}</span><small>{o.area}</small></span></td>
                  <td><span className="two"><span>{sup(o.sid).name}</span><small>{o.hub}</small></span></td>
                  <td><span className="two"><span>{o.lines[0].q}× {o.lines[0].n}</span><small>{o.lines.length > 1 ? `+${o.lines.length - 1} more` : " "}</small></span></td>
                  <td className="r num"><span className="two"><b>{money(o.itemsTotal)}</b><small>fee {money(o.fee)}</small></span></td>
                  <td><StatusPill o={o} /></td>
                  <td>{r ? <span className="two"><span>{r.name}</span><small>{r.plate}</small></span> : <span className="muted">{["ready", "packed"].includes(o.status) ? "Not assigned" : "-"}</span>}</td>
                  <td className={`r num ${end ? "muted" : ageCls(m, 8, 15)}`}>{end ? "-" : ageTxt(since(o))}</td>
                </tr>
              );
            })}</tbody></table></div>
        )}
      </section>
      <OrderDrawer order={open} onClose={closeOrder} />
    </>
  );
}

export function OrderDrawer({ order: o, onClose }: { order?: Order; onClose: () => void }) {
  const router = useRouter(); const { toast, dialog, confirm } = useOverlay(); useDb();
  if (!o) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const s = sup(o.sid); const r = o.rider ? rid(o.rider) : null; const step = STATUS[o.status].step; const m = minsSince(since(o)); const live = !["delivered", "cancelled"].includes(o.status);
  const slow = m > 0 && o.status === "payment_submitted" && m > 10;
  return (
    <Drawer open onClose={onClose} title={o.code}
      sub={<><StatusPill o={o} /><span className="muted">{o.buyer} · {money(o.itemsTotal)} · {ageTxt(o.createdAt)} old</span></>}
      footer={<>
        {live && ["packed", "ready", "in_transit"].includes(o.status) && <PermButton perm="orders" className="btn primary" onClick={() => dialog((close) => <AssignDialog order={o} close={close} onDone={(n) => toast(`${n} assigned to ${o.code}`)} />)}><Icon name="bike" small /> {o.rider ? "Reassign rider" : "Assign rider"}</PermButton>}
        <PermButton perm="orders" onClick={() => dialog((close) => <MessageOrderDialog order={o} who="supplier" close={close} />)}><Icon name="msg" small /> Message supplier</PermButton>
        <PermButton perm="orders" onClick={() => dialog((close) => <MessageOrderDialog order={o} who="buyer" close={close} />)}><Icon name="msg" small /> Message buyer</PermButton>
        {live && <PermButton perm="orders" className="btn danger" onClick={() => confirm({ title: `Cancel ${o.code}?`, text: `${o.buyer} and ${s.name} will be told. If the buyer already paid the supplier, the supplier must refund them directly.`, label: "Cancel order", danger: true, field: { label: "Reason", options: ["Buyer did not pay", "Supplier out of stock", "Duplicate order", "Suspected fraud", "Buyer asked to cancel"] }, onOk: (why) => { cancelOrder(o, why); toast(`${o.code} cancelled`); } })}>Cancel order</PermButton>}
        {!o.dispute && o.status !== "cancelled" && <PermButton perm="disputes" onClick={() => confirm({ title: `Open a dispute on ${o.code}?`, text: "The case goes to the Disputes desk with a response clock.", label: "Open dispute", field: { label: "Type", options: ["Damaged on arrival", "Wrong item", "Quantity short", "Payment not received", "Late delivery", "Rider no-show"] }, onOk: (kind) => { const id = openDispute(o, kind); toast(`${id} opened`); } })}><Icon name="shield" small /> Open dispute</PermButton>}
      </>}>
      {o.status === "ready" && !o.rider && <div className="banner warn mx-5 mt-4"><Icon name="bike" small /><span><b>No rider yet.</b> Waiting {ageTxt(since(o))}. Assign one below. Nearest first.</span><PermButton perm="orders" className="btn sm primary" onClick={() => dialog((close) => <AssignDialog order={o} close={close} onDone={(n) => toast(`${n} assigned to ${o.code}`)} />)}>Assign rider</PermButton></div>}
      {o.status === "payment_submitted" && <div className={`banner ${slow ? "warn" : ""} mx-5 mt-4`}><Icon name="clock" small /><span><b>{s.name} must confirm the payment.</b> Buyer sent code <b className="num">{o.mpesa}</b> for {money(o.itemsTotal)}. Waiting {ageTxt(since(o))}.</span><PermButton perm="orders" className="btn sm" onClick={() => { nudgeSupplier(o); toast(`Reminder sent to ${s.name}`); }}>Nudge supplier</PermButton></div>}
      {o.status === "awaiting_payment" && <div className="banner mx-5 mt-4"><Icon name="wallet" small /><span>Buyer has not paid Till <b className="num">{s.till}</b> yet. Orders auto-cancel after 30 minutes.</span></div>}
      {o.status === "disputed" && <div className="banner warn mx-5 mt-4"><Icon name="shield" small /><span>Open dispute <b>{o.dispute}</b>.</span><button className="btn sm" onClick={() => router.push(`/disputes?id=${o.dispute}`)}>Open case</button></div>}

      <div className="sect"><h3>Parties</h3>
        <div className="kv"><div><small>Buyer</small><b>{o.buyer}</b><div className="muted">{o.area}</div></div><div><small>Supplier</small><b>{s.name}</b><div className="muted">{s.stall}</div></div><div><small>Supplier Till</small><b className="num">{s.till}</b></div><div><small>Rider</small>{r ? <><b>{r.name}</b><div className="muted">{r.plate} · {r.phone}</div></> : <b className="muted">Not assigned</b>}</div></div></div>
      <div className="sect"><h3>Money</h3>
        {o.lines.map((l, i) => <div key={i} className="flex justify-between gap-3"><span>{l.q}× {l.n}</span><b className="num">{money(l.q * l.p)}</b></div>)}
        <div className="kv border-t border-line pt-3"><div><small>Item money (buyer to supplier Till)</small><b className="num">{money(o.itemsTotal)}</b><div className="muted">{step >= 2 || o.status === "disputed" ? "Supplier confirmed received" : "Not confirmed yet"}</div></div><div><small>GEKEL fee (STK push to GEKEL)</small><b className="num">{money(o.fee)}</b><div className="muted">Find, delivery {o.km} km, service</div></div></div>
        {o.mpesa && <div className="muted">Buyer&apos;s M-Pesa code <b className="num text-ink">{o.mpesa}</b></div>}</div>
      <div className="sect"><h3>Progress</h3>
        <div className="tl">{FLOW.map((f, i) => { const done = step > i || o.status === "delivered" || o.status === "disputed"; const cur = !done && step === i && o.status !== "cancelled"; return <div key={f} className={`s ${done ? "done" : cur ? "cur" : "todo"}`}><span className="m">{done && <Icon name="check" small />}</span><div><b>{f}</b></div></div>; })}
          {o.status === "cancelled" && <div className="s done"><span className="m"><Icon name="x" small /></span><div><b>Cancelled</b></div></div>}</div></div>
      <div className="sect"><h3>Proof photos</h3><div className="frames">{o.proofs.length ? o.proofs.map((p, i) => <ProofFrame key={i} p={p} />) : <NoProof />}</div></div>
      <div className="sect"><h3>Activity</h3><div className="grid gap-2">{[...o.log].reverse().map((e, i) => <div key={i} className="grid grid-cols-[48px_minmax(0,1fr)] gap-2.5 text-[13px]"><span className="muted num">{clock(e.at)}</span><span>{e.t}</span></div>)}</div></div>
    </Drawer>
  );
}

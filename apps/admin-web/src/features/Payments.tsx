"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOverlay } from "@/components/Overlay";
import { Empty, PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { MatchDialog } from "./dialogs";
import { copyText } from "./Orders";
import { refundPayment } from "@/lib/actions";
import { ageTxt, clock, money } from "@/lib/format";
import { ord, useDb } from "@/lib/store";

export default function Payments() {
  const db = useDb()!; const router = useRouter(); const { toast, dialog, confirm } = useOverlay(); const [tab, setTab] = useState<"stream" | "unmatched">("stream");
  const ok = db.feeStream.filter((f) => f.state === "matched"); const bad = db.feeStream.filter((f) => f.state === "failed");
  const total = ok.reduce((a, f) => a + f.amount, 0); const rate = Math.round((ok.length / Math.max(1, ok.length + bad.length)) * 100); const avg = Math.round(ok.reduce((a, f) => a + f.ms, 0) / Math.max(1, ok.length));
  const csv = () => copyText(["Time,Ref,Order,Amount,Result", ...db.feeStream.map((f) => [clock(f.at), f.ref, f.order ? ord(f.order)?.code : "", f.amount, f.state].join(","))].join("\n"), `Copied ${db.feeStream.length} payments as CSV`, toast);
  return (
    <>
      <PageHead title="Payments" sub="GEKEL fees only. Item money goes straight from buyers to supplier Tills and never passes through GEKEL."><button className="btn" onClick={csv}><Icon name="copy" small /> Copy as CSV</button></PageHead>
      <div className="grid g4">
        <div className="card kpi"><span className="k">Fees collected today</span><span className="v num">{money(total)}</span><span className="d flat">{ok.length} payments</span></div>
        <div className="card kpi"><span className="k">STK push success</span><span className="v num">{rate}%</span><span className={`d ${rate >= 95 ? "up" : "down"}`}>{bad.length} failed</span></div>
        <div className="card kpi"><span className="k">Average match time</span><span className="v num">{avg} ms</span><span className="d flat">Callback to order</span></div>
        <div className="card kpi"><span className="k">Unmatched</span><span className="v num">{db.unmatched.length}</span><span className={`d ${db.unmatched.length ? "down" : "up"}`}>{money(db.unmatched.reduce((a, u) => a + u.amount, 0))} to resolve</span></div>
      </div>
      <section className="card">
        <Tabs tabs={[["stream", "Fee payments", db.feeStream.length], ["unmatched", "Unmatched", db.unmatched.length]]} value={tab} onChange={setTab} />
        {tab === "stream" ? (
          <div className="tw"><table className="t"><thead><tr><th>Time</th><th>M-Pesa ref</th><th>Order</th><th className="r">Amount</th><th>Result</th><th className="r">Matched in</th></tr></thead>
            <tbody>{db.feeStream.slice(0, 40).map((f) => { const o = f.order ? ord(f.order) : undefined; return (
              <tr key={f.id} data-row={o ? "" : undefined} onClick={() => o && router.push(`/orders?open=${o.id}`)}><td className="num">{clock(f.at)}</td><td className="num">{f.ref}</td><td>{o ? <span className="id">{o.code}</span> : <span className="muted">No order</span>}</td><td className="r num">{money(f.amount)}</td>
                <td>{f.state === "matched" ? <Pill tone="ok">Matched</Pill> : <span className="two"><Pill tone="bad">Failed</Pill><small>{f.why}</small></span>}</td><td className="r num muted">{f.ms ? `${f.ms} ms` : "-"}</td></tr>); })}</tbody></table></div>
        ) : db.unmatched.length ? (
          <>
            <div className="mx-[18px] mt-4"><div className="banner m-0"><Icon name="alert" small /><span>These payments reached GEKEL&apos;s paybill but no order matched the amount and phone. Match each to an order, or refund it.</span></div></div>
            <div className="tw"><table className="t"><thead><tr><th>Received</th><th>M-Pesa ref</th><th>From</th><th className="r">Amount</th><th>Why it did not match</th><th /></tr></thead>
              <tbody>{db.unmatched.map((u) => (
                <tr key={u.ref}><td className="num">{ageTxt(u.at)} ago</td><td className="num">{u.ref}</td><td className="num">{u.phone}</td><td className="r num">{money(u.amount)}</td><td className="muted">{u.hint}</td>
                  <td className="r"><PermButton perm="payments" className="btn sm" onClick={() => dialog((close) => <MatchDialog u={u} close={close} />)}>Match to order</PermButton>{" "}
                    <PermButton perm="payments" className="btn sm ghost" onClick={() => confirm({ title: `Refund ${money(u.amount)} to ${u.phone}?`, text: "Sent back by M-Pesa reversal. This cannot be undone.", label: "Refund payment", danger: true, field: { label: "Reason", placeholder: "Why is this being refunded?" }, onOk: (r) => { refundPayment(u.ref, r); toast("Refund sent"); } })}>Refund</PermButton></td></tr>))}</tbody></table></div>
          </>
        ) : <Empty title="Everything is matched">Nothing is waiting for a person.</Empty>}
      </section>
    </>
  );
}

"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOverlay } from "@/components/Overlay";
import { Bar, Chips, Empty, PageHead, PermButton } from "@/components/ui";
import { broadcastRequest, closeRequest } from "@/lib/actions";
import { ageCls, ageTxt, minsSince, money } from "@/lib/format";
import { inHub, useDb } from "@/lib/store";

type St = "open" | "matched" | "expired";
export default function Requests() {
  const db = useDb()!; const { toast, confirm } = useOverlay(); const [st, setSt] = useState<St>("open");
  const R = db.requests.filter(inHub); const rows = R.filter((q) => q.status === st);
  return (
    <>
      <PageHead title="Requests" sub="What buyers are asking for. Requests with no quote after 8 minutes are flagged on the overview." />
      <section className="card">
        <div className="toolbar"><Chips<St> items={[["open", "Open", R.filter((q) => q.status === "open").length], ["matched", "Matched", R.filter((q) => q.status === "matched").length], ["expired", "Expired", R.filter((q) => q.status === "expired").length]]} value={st} onChange={setSt} /></div>
        {rows.length ? (
          <div className="tw"><table className="t"><thead><tr><th>Request</th><th>Buyer</th><th>Hub</th><th className="r">Quantity</th><th className="r">Budget</th><th>Quotes</th><th className="r">Age</th><th /></tr></thead>
            <tbody>{rows.map((q) => {
              const m = minsSince(q.at); const n = db.suppliers.filter((s) => s.status === "verified" && s.hub === q.hub).length;
              return (
                <tr key={q.id}>
                  <td><span className="two"><b>{q.title}</b><small className="num">{q.code}</small></span></td><td>{q.buyer}</td><td>{q.hub}</td>
                  <td className="r num">{q.qty} {q.unit}</td><td className="r num">{money(q.budget)}</td>
                  <td><div className="flex items-center gap-2"><div className="w-[70px]"><Bar pct={(q.quotes / 3) * 100} tone={q.quotes ? "ok" : "bad"} /></div><span className="num">{q.quotes}</span></div></td>
                  <td className={`r num ${q.status === "open" && !q.quotes ? ageCls(m, 5, 8) : ""}`}>{ageTxt(q.at)}</td>
                  <td className="r">{q.status === "open" && <>
                    <PermButton perm="orders" className="btn sm" onClick={() => { const r = broadcastRequest(q.id); toast(`${r.q.code} pushed to ${r.n} suppliers`); }}><Icon name="send" small /> Ask {n} suppliers</PermButton>{" "}
                    <PermButton perm="orders" className="btn sm ghost" onClick={() => confirm({ title: `Close ${q.code}?`, text: "Buyers will see it as expired and suppliers can no longer quote.", label: "Close request", onOk: () => { closeRequest(q.id); toast(`${q.code} closed`); } })}>Close</PermButton></>}</td>
                </tr>
              );
            })}</tbody></table></div>
        ) : <Empty title="Nothing here">No {st} requests in this view.</Empty>}
      </section>
    </>
  );
}

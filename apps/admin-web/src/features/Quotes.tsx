"use client";
import { useState } from "react";
import { useOverlay } from "@/components/Overlay";
import { Chips, Empty, Kpi, PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { expireQuote, nudgeQuote } from "@/lib/actions2";
import { ageTxt, minsSince, money } from "@/lib/format";
import { sup, useDb } from "@/lib/store";
import Requests from "./Requests";

type St = "waiting" | "answered" | "expired";
const med = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

export default function Quotes() {
  const db = useDb()!; const { toast, confirm } = useOverlay(); const [tab, setTab] = useState<"ask" | "bulk">("ask"); const [st, setSt] = useState<St>("waiting");
  const Q = db.quoteAsks; const answered = Q.filter((q) => q.status === "answered"); const times = answered.map((q) => (q.answeredAt! - q.at) / 60000);
  const fast = answered.length ? Math.round((times.filter((t) => t <= 15).length / answered.length) * 100) : 0;
  const per = new Map<string, number[]>(); answered.forEach((q) => per.set(q.sid, [...(per.get(q.sid) ?? []), (q.answeredAt! - q.at) / 60000]));
  const slow = [...per.entries()].map(([sid, t]) => ({ s: sup(sid), m: Math.round(t.reduce((a, b) => a + b, 0) / t.length) })).sort((a, b) => b.m - a.m).slice(0, 4);
  const rows = Q.filter((q) => q.status === st);
  return (
    <>
      <PageHead title="Quotes" sub="Two ways buyers ask for prices. Ask quote is one item from one supplier. Bulk requests go to every supplier in a hub." />
      <div className="grid g4">
        <Kpi k="Ask quote, waiting" v={Q.filter((q) => q.status === "waiting").length} d={`${Q.filter((q) => q.status === "waiting" && minsSince(q.at) > 20).length} over 20 minutes`} tone={Q.some((q) => q.status === "waiting" && minsSince(q.at) > 20) ? "down" : "flat"} />
        <Kpi k="Median answer time" v={`${Math.round(med(times))} min`} d="Target under 15 minutes" />
        <Kpi k="Answered within 15 min" v={`${fast}%`} d={`${answered.length} answered`} tone={fast >= 70 ? "up" : "down"} />
        <Kpi k="Bulk requests open" v={db.requests.filter((q) => q.status === "open").length} d="See the second tab" />
      </div>
      <section className="card">
        <Tabs<"ask" | "bulk"> tabs={[["ask", "Ask quote", Q.filter((q) => q.status === "waiting").length], ["bulk", "Bulk requests", db.requests.filter((q) => q.status === "open").length]]} value={tab} onChange={setTab} />
        {tab === "ask" ? (<>
          <div className="toolbar"><Chips<St> items={[["waiting", "Waiting", Q.filter((q) => q.status === "waiting").length], ["answered", "Answered", answered.length], ["expired", "Closed", Q.filter((q) => q.status === "expired").length]]} value={st} onChange={setSt} /></div>
          {rows.length ? <div className="tw"><table className="t"><thead><tr><th>Item</th><th>Buyer</th><th>Supplier</th><th className="r">Qty</th><th className="r">Quoted</th><th className="r">{st === "answered" ? "Took" : "Waiting"}</th><th /></tr></thead>
            <tbody>{rows.map((q) => (
              <tr key={q.id}><td><span className="two"><b>{q.product}</b><small>{q.note || "No note"}</small></span></td><td>{q.buyer}</td><td>{sup(q.sid).name}</td><td className="r num">{q.qty}</td><td className="r num">{q.price ? money(q.price) : "-"}</td>
                <td className={`r num ${q.status === "waiting" && minsSince(q.at) > 20 ? "age hot" : ""}`}>{q.status === "answered" ? `${Math.round((q.answeredAt! - q.at) / 60000)} min` : ageTxt(q.at)}</td>
                <td className="r">{q.status === "waiting" && <><PermButton perm="orders" className="btn sm" onClick={() => { nudgeQuote(q); toast(`${sup(q.sid).name} reminded`); }}>Nudge{q.nudges ? ` (${q.nudges})` : ""}</PermButton>{" "}
                  <PermButton perm="orders" className="btn sm ghost" onClick={() => confirm({ title: "Close this quote request?", text: `${q.buyer} is told the supplier could not answer and is offered similar items.`, label: "Close", onOk: () => { expireQuote(q); toast("Closed"); } })}>Close</PermButton></>}</td></tr>))}</tbody></table></div>
            : <Empty title="Nothing here">No {st} requests.</Empty>}
          {slow.length > 0 && <div className="sect"><h3>Slowest to answer (average)</h3><div className="flex flex-wrap gap-2">{slow.map((x) => <Pill key={x.s.id} tone={x.m > 15 ? "warn" : "ok"}>{x.s.name}: {x.m} min</Pill>)}</div></div>}
        </>) : <Requests embedded />}
      </section>
    </>
  );
}

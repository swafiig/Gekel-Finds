"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOverlay } from "@/components/Overlay";
import { Empty, PageHead } from "@/components/ui";
import { copyText } from "./Orders";
import { csvCell, dayClock } from "@/lib/format";
import { useDb } from "@/lib/store";

export default function Audit() {
  const db = useDb()!; const { toast } = useOverlay(); const [q, setQ] = useState(""); const n = q.toLowerCase();
  const rows = db.audit.filter((a) => !n || `${a.who} ${a.act} ${a.tgt} ${a.d}`.toLowerCase().includes(n));
  return (
    <>
      <PageHead title="Audit log" sub="Every change anyone makes here, with who and when. It cannot be edited.">
        <button className="btn" onClick={() => copyText(["When,Who,Action,Target,Detail", ...db.audit.map((a) => [dayClock(a.at), a.who, a.act, a.tgt, a.d].map(csvCell).join(","))].join("\n"), `Copied ${db.audit.length} entries as CSV`, toast)}><Icon name="copy" small /> Copy as CSV</button>
      </PageHead>
      <section className="card">
        <div className="toolbar"><input className="input w-full max-w-[420px]" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by person, action or target" aria-label="Search audit log" /></div>
        {rows.length ? (
          <div className="tw"><table className="t"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
            <tbody>{rows.slice(0, 100).map((a, i) => <tr key={a.at + a.act + i}><td className="num whitespace-nowrap">{dayClock(a.at)}</td><td>{a.who}</td><td><b>{a.act}</b></td><td>{a.tgt}</td><td className="muted">{a.d}</td></tr>)}</tbody></table></div>
        ) : <Empty title="No matching entries">Try a different name or action.</Empty>}
      </section>
    </>
  );
}

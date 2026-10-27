"use client";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { useDownload } from "@/components/hooks";
import { Drawer, useOverlay } from "@/components/Overlay";
import { Chips, Empty, PageHead, Pill } from "@/components/ui";
import { clock, dayClock } from "@/lib/format";
import { useDb } from "@/lib/store";
import type { Level, LogRow } from "@/lib/types";

const tone = (l: Level) => (l === "error" ? "bad" : l === "warn" ? "warn" : l === "debug" ? "" : "dk") as "bad" | "warn" | "" | "dk";
export default function Logs() {
  const db = useDb()!; const dl = useDownload(); const { toast } = useOverlay(); const [lvl, setLvl] = useState<Level | "all">("all"); const [src, setSrc] = useState("all"); const [q, setQ] = useState(""); const [paused, setPaused] = useState(false); const [frozen, setFrozen] = useState<LogRow[]>([]); const [sel, setSel] = useState<LogRow | null>(null);
  const base = paused ? frozen : db.logs; const srcs = useMemo(() => [...new Set(db.logs.map((l) => l.src))].sort(), [db.logs.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = base.filter((l) => (lvl === "all" || l.level === lvl) && (src === "all" || l.src === src) && (!q.trim() || `${l.msg} ${l.src} ${JSON.stringify(l.meta ?? {})}`.toLowerCase().includes(q.toLowerCase())));
  const cnt = (l: Level) => base.filter((x) => x.level === l).length;
  return (
    <>
      <PageHead title="Logs" sub="What the apps and the backend are saying. Errors from phones, payment callbacks, SMS and dispatch, newest first.">
        <button className="btn" onClick={() => { if (!paused) setFrozen([...db.logs]); setPaused(!paused); }}><Icon name={paused ? "play" : "pause"} small /> {paused ? "Resume live" : "Pause live"}</button>
        <button className="btn" onClick={() => { dl("gekel-logs.csv", [["time", "level", "source", "message", "details"], ...rows.map((r) => [new Date(r.at).toISOString(), r.level, r.src, r.msg, JSON.stringify(r.meta ?? {})])]); toast(`${rows.length} lines saved`); }}><Icon name="download" small /> Download CSV</button>
      </PageHead>
      <section className="card">
        <div className="toolbar"><Chips<Level | "all"> items={[["all", "All", base.length], ["error", "Errors", cnt("error")], ["warn", "Warnings", cnt("warn")], ["info", "Info", cnt("info")], ["debug", "Debug", cnt("debug")]]} value={lvl} onChange={setLvl} />
          <select className="input" style={{ maxWidth: 170 }} aria-label="Source" value={src} onChange={(e) => setSrc(e.target.value)}><option value="all">All sources</option>{srcs.map((s) => <option key={s}>{s}</option>)}</select>
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search messages, request ids" aria-label="Search logs" value={q} onChange={(e) => setQ(e.target.value)} />{paused && <Pill tone="warn">Paused</Pill>}</div>
        {rows.length ? <div className="tw"><table className="t logt"><thead><tr><th style={{ width: 90 }}>Time</th><th style={{ width: 90 }}>Level</th><th style={{ width: 120 }}>Source</th><th>Message</th></tr></thead>
          <tbody>{rows.slice(0, 150).map((l) => <tr key={l.id} data-row onClick={() => setSel(l)}><td className="num muted">{clock(l.at)}</td><td><Pill tone={tone(l.level)} plain>{l.level}</Pill></td><td className="muted">{l.src}</td><td className="mono">{l.msg}</td></tr>)}</tbody></table></div> : <Empty title="No lines match">Change the level or clear the search.</Empty>}
        {rows.length > 150 && <div className="sect"><span className="muted">Showing the newest 150 of {rows.length}. Narrow the filters or download the CSV.</span></div>}
      </section>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel ? sel.src : ""} sub={sel && <><Pill tone={tone(sel.level)}>{sel.level}</Pill><span className="muted">{dayClock(sel.at)}</span></>} footer={sel && <button className="btn" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(sel, null, 2)); toast("Copied"); }}><Icon name="copy" small /> Copy as text</button>}>
        {sel && <><div className="sect"><h3>Message</h3><p className="m-0 mono">{sel.msg}</p></div><div className="sect"><h3>Details</h3><pre className="code">{JSON.stringify(sel.meta ?? {}, null, 2)}</pre><span className="hint">Quote the req id when you ask the developer to look into a problem.</span></div></>}
      </Drawer>
    </>
  );
}

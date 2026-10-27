"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DialogShell, useOverlay } from "@/components/Overlay";
import { Banner, Bar, Empty, PageHead, PermButton, Pill, Toggle } from "@/components/ui";
import { setMaintenance, setMinVersion } from "@/lib/actions2";
import { ageTxt } from "@/lib/format";
import { can, useDb } from "@/lib/store";
import type { AppHealth, Svc } from "@/lib/types";
import { useState } from "react";

const tone = (s: Svc) => (s === "up" ? "ok" : s === "degraded" ? "warn" : "bad") as "ok" | "warn" | "bad";
const word = (s: Svc) => (s === "up" ? "Up" : s === "degraded" ? "Slow" : "Down");

function Area({ v }: { v: number[] }) {
  const w = 260, h = 64, mx = Math.max(...v, 1); const pts = v.map((x, i) => [(i / (v.length - 1)) * w, h - 4 - (x / mx) * (h - 10)]); const s = pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  return (<svg className="spark" style={{ height: 64 }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Active users over the last 24 hours"><polygon points={`0,${h} ${s} ${w},${h}`} fill="var(--accent)" opacity={0.12} /><polyline points={s} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" /><circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill="var(--accent)" /></svg>);
}

export default function Health() {
  const db = useDb()!; const { toast, confirm, dialog } = useOverlay(); const router = useRouter();
  useEffect(() => { document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "center" }); }, []);
  const bad = db.services.filter((s) => s.state !== "up"); const total = db.apps.reduce((a, x) => a + x.activeNow, 0);
  return (
    <>
      <PageHead title="App health" sub="Is each app up, and who is using it right now. Active means the app was open in the last 5 minutes." />
      {(db.apps.some((a) => a.state !== "up") || bad.length > 0) ? <Banner icon="alert" warn><b>{db.apps.filter((a) => a.state !== "up").length + bad.length} thing{db.apps.filter((a) => a.state !== "up").length + bad.length === 1 ? "" : "s"} to look at.</b> {[...db.apps.filter((a) => a.state !== "up").map((a) => `${a.name}: ${a.note}`), ...bad.map((s) => `${s.name}: ${s.note ?? word(s.state)}`)].join(" ")}</Banner> : <Banner icon="check">All apps and services are healthy. {total} people are using GEKEL right now.</Banner>}
      <div className="grid g3">{db.apps.map((a) => <AppCard key={a.key} a={a} onMaint={() => confirm({ title: a.maintenance ? `Turn off maintenance for ${a.name}?` : `Put ${a.name} in maintenance mode?`, text: a.maintenance ? "People can use the app again straight away." : "Everyone using the app sees a 'we are back soon' screen and cannot place or update anything. Do this before a database change or a payment outage.", label: a.maintenance ? "Turn off" : "Turn on", danger: !a.maintenance, onOk: () => { setMaintenance(a.key, !a.maintenance); toast(`${a.name}: maintenance ${a.maintenance ? "on" : "off"}`); } })} onMin={() => dialog((close) => <MinDialog a={a} close={close} />)} />)}</div>
      <section className="card" id="services"><header><div><h2>Behind the apps</h2><p>The services the apps depend on, checked every few seconds</p></div><button className="btn sm" onClick={() => router.push("/integrations")}>Integrations</button></header>
        <div className="tw pt-2"><table className="t"><thead><tr><th>Service</th><th>Status</th><th className="r">Response</th><th>Note</th><th className="r">Checked</th></tr></thead>
          <tbody>{db.services.map((s) => <tr key={s.id}><td><b>{s.name}</b></td><td><Pill tone={tone(s.state)}>{word(s.state)}</Pill></td><td className="r num">{s.latency >= 1000 ? `${(s.latency / 1000).toFixed(1)} s` : `${s.latency} ms`}</td><td className="soft">{s.note ?? ""}</td><td className="r num">{ageTxt(s.checkedAt)} ago</td></tr>)}</tbody></table></div></section>
      <p className="muted m-0">These numbers are sample data. In the real build each app sends a heartbeat every minute and your API reports crashes, response times and errors here (see the README, Tech section).</p>
    </>
  );
}

function AppCard({ a, onMaint, onMin }: { a: AppHealth; onMaint: () => void; onMin: () => void }) {
  const ed = can("tech");
  return (
    <section className="card" id={a.key}><header><div><h2>{a.name}</h2><p>{a.platform}</p></div><Pill tone={tone(a.state)}>{a.maintenance ? "Maintenance" : word(a.state)}</Pill></header>
      <div className="body grid gap-3">
        {a.note && <Banner icon="alert" warn>{a.note}</Banner>}
        <div className="flex items-end justify-between gap-3"><div><div className="disp text-[38px] font-extrabold leading-none num">{a.activeNow}</div><span className="muted">using it now</span></div><div className="text-right"><b className="num">{a.dau.toLocaleString("en-KE")}</b><div className="muted">people today</div></div></div>
        <Area v={a.series} />
        <div className="kv"><div><small>Crash-free sessions</small><b className="num">{a.crashFree}%</b></div><div><small>Response time (slowest 5%)</small><b className="num">{a.p95} ms</b></div><div><small>Errors per minute</small><b className="num">{a.errPerMin}</b></div><div><small>Uptime, 30 days</small><b className="num">{a.uptime30}%</b></div></div>
        <div><div className="flex justify-between text-[13px]"><span>On the latest version ({a.latest})</span><b className="num">{a.onLatest}%</b></div><Bar pct={a.onLatest} tone={a.onLatest >= 80 ? "ok" : "acc"} /><span className="hint">Running {a.version}. Minimum allowed {a.minVersion}. {a.installs.toLocaleString("en-KE")} installs.</span></div>
        <div className="flex gap-2 flex-wrap items-center"><span className="flex items-center gap-2"><Toggle on={a.maintenance} label={`Maintenance mode, ${a.name}`} disabled={!ed} onChange={onMaint} /><span>Maintenance mode</span></span><PermButton perm="tech" className="btn sm ml-auto" onClick={onMin}>Minimum version</PermButton></div>
      </div></section>
  );
}

function MinDialog({ a, close }: { a: AppHealth; close: () => void }) {
  const { toast } = useOverlay(); const [v, setV] = useState(a.minVersion); const ok = /^\d+\.\d+\.\d+$/.test(v);
  return (
    <DialogShell title={`Minimum version for ${a.name}`} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { if (!ok) return; setMinVersion(a.key, v); close(); toast(`Older than ${v} must update`); }}>Save</button></>}>
      <p className="soft m-0">People on a version older than this see an "Update to continue" screen. Use it when an old version has a bug that could lose money or orders. Latest is {a.latest}.</p>
      <div className="field"><label htmlFor="mv">Minimum version</label><input id="mv" className={`input num ${ok ? "" : "err"}`} value={v} onChange={(e) => setV(e.target.value)} />{!ok && <span className="errtxt">Use the form 1.4.0</span>}</div>
    </DialogShell>
  );
}
void Empty;

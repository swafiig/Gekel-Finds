"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { useOverlay } from "@/components/Overlay";
import { Banner, Empty, PageHead, PermButton, Pill } from "@/components/ui";
import { BroadcastDialog } from "./dialogs";
import { nudgeSupplier, broadcastRequest } from "@/lib/actions";
import { AREAS, HUBS, VERIFIED_IDS, STATUS } from "@/lib/constants";
import { clock, money } from "@/lib/format";
import { getAlerts, inHub, ord, sup, useDb, type Alert } from "@/lib/store";
import type { Db } from "@/lib/types";

function Radar({ db }: { db: Db }) {
  const grid: ReactNode[] = []; for (let x = 0; x <= 640; x += 40) grid.push(<path key={"x" + x} d={`M${x} 0V360`} stroke="#1d1b19" />); for (let y = 0; y <= 360; y += 40) grid.push(<path key={"y" + y} d={`M0 ${y}H640`} stroke="#1d1b19" />);
  const roads = ["M0 215C120 200 200 190 300 170S500 150 640 120", "M60 360C120 280 200 230 300 170", "M470 0C470 80 480 150 470 230S480 320 520 360", "M0 80C150 90 300 70 470 150"];
  const onJob = db.riders.filter((r) => r.job && inHub(r));
  return (
    <svg className="map" viewBox="0 0 640 360" role="img" aria-label="Schematic map of Eastleigh and Kamukunji with live rider positions">
      {grid}
      {roads.map((d) => <path key={d} d={d} fill="none" stroke="#2c2927" strokeWidth={5} strokeLinecap="round" />)}
      {Object.entries(HUBS).map(([n, h]) => (<g key={n}><ellipse cx={h.x} cy={h.y} rx={92} ry={64} fill={h.color} fillOpacity={0.05} stroke={h.color} strokeOpacity={0.5} strokeDasharray="4 5" /><text x={h.x} y={h.y - 72} textAnchor="middle" fill={h.color} fontSize={12} fontWeight={700}>{n}</text></g>))}
      {Object.entries(AREAS).map(([n, p]) => <text key={n} x={p.x} y={p.y + 4} textAnchor="middle" fill="#6d675f" fontSize={10}>{n}</text>)}
      {db.suppliers.filter((s) => s.status === "verified" && inHub(s)).map((s) => <rect key={s.id} x={s.x - 4} y={s.y - 4} width={8} height={8} rx={2} fill="#F4F2EE" opacity={0.85}><title>{s.name}</title></rect>)}
      {onJob.map((r) => <line key={r.id} x1={r.x} y1={r.y} x2={r.tx} y2={r.ty} stroke="#FA3F0A" strokeOpacity={0.6} strokeDasharray="3 4" />)}
      {db.orders.filter((o) => o.status === "in_transit" && inHub(o)).map((o) => <circle key={o.id} cx={o.destX} cy={o.destY} r={6} fill="none" stroke="#FA3F0A" strokeWidth={2}><title>{o.code} to {o.buyer}</title></circle>)}
      {db.orders.filter((o) => o.status === "ready" && !o.rider && inHub(o)).map((o) => { const s = sup(o.sid); return (<circle key={o.id} cx={s.x} cy={s.y} r={12} fill="none" stroke="#FFD166" strokeWidth={2}><animate attributeName="r" values="9;17;9" dur="2s" repeatCount="indefinite" /><title>{o.code} waiting for a rider</title></circle>); })}
      {db.riders.filter((r) => r.status !== "offline" && r.status !== "suspended" && inHub(r)).map((r) => <circle key={r.id} cx={r.x} cy={r.y} r={r.job ? 7 : 5} fill={r.job ? "#FA3F0A" : "#FFFFFF"} stroke="#0C0B0A" strokeWidth={2}><title>{r.name}{r.job ? " on a job" : " available"}</title></circle>)}
    </svg>
  );
}

function HourChart({ db }: { db: Db }) {
  const W = 640, H = 210, L = 30, B = 26, T = 10; const hrs = Array.from({ length: 17 }, (_, i) => i + 5);
  const max = Math.max(...db.hourly.yest, ...db.hourly.today, 10); const bw = (W - L - 6) / hrs.length; const nowH = new Date().getHours();
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const line = hrs.map((h, i) => `${i ? "L" : "M"}${(L + i * bw + bw / 2).toFixed(1)} ${y(db.hourly.yest[h]).toFixed(1)}`).join("");
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Orders per hour, today compared with yesterday">
      {[0, Math.round(max / 2), max].map((v) => (<g key={v}><line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={L - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>))}
      {hrs.filter((h) => h % 2 === 1).map((h) => <text key={h} x={L + (h - 5) * bw + bw / 2} y={H - 8} textAnchor="middle">{h}:00</text>)}
      <path d={line} fill="none" stroke="var(--ink-3)" strokeWidth={2} strokeDasharray="4 4" />
      {hrs.map((h, i) => { const v = db.hourly.today[h]; if (!v) return null; return <rect key={h} x={L + i * bw + 3} y={y(v)} width={bw - 6} height={Math.max(2, H - B - y(v))} rx={3} fill={h === nowH ? "var(--accent)" : "var(--ink)"}><title>{h}:00 today: {v} orders</title></rect>; })}
    </svg>
  );
}

function Spark({ vals, color = "var(--ink)" }: { vals: number[]; color?: string }) {
  const w = 200, h = 38; const mx = Math.max(...vals, 1), mn = Math.min(...vals);
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 4 - ((v - mn) / (mx - mn || 1)) * (h - 10)]);
  const s = pts.map((p) => p.join(",")).join(" ");
  return (<svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><polygon points={`0,${h} ${s} ${w},${h}`} fill={color} opacity={0.08} /><polyline points={s} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" /><circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill="var(--accent)" /></svg>);
}

function stats(db: Db) {
  const O = db.orders.filter(inHub); const paid = O.filter((o) => STATUS[o.status].step >= 2 || o.status === "disputed"); const del = O.filter((o) => o.status === "delivered");
  const durs = del.map((o) => (o.log[o.log.length - 1].at - o.createdAt) / 60000).filter((x) => x > 0);
  return { n: O.length, fee: paid.reduce((a, o) => a + o.fee, 0), direct: paid.reduce((a, o) => a + o.itemsTotal, 0), avg: durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0, flight: O.filter((o) => !["delivered", "cancelled"].includes(o.status)).length, delivered: del.length, paid: paid.length };
}

export function AlertList({ limit = 7 }: { limit?: number }) {
  useDb(); const router = useRouter(); const { toast } = useOverlay(); const L = getAlerts().slice(0, limit);
  const run = (a: Alert) => {
    if (a.act === "nudge") { nudgeSupplier(ord(a.id)!); toast("Reminder sent"); }
    else if (a.act === "broadcast-req") { const { q, n } = broadcastRequest(a.id); toast(`${q.code} pushed to ${n} suppliers`); }
    else if (a.act === "open-order") router.push(`/orders?open=${a.id}`);
    else if (a.act === "open-dispute") router.push(`/suluhu?id=${a.id}`);
    else if (a.act === "open-rider") router.push(`/riders?open=${a.id}`);
    else if (a.act === "open-find") router.push(`/find?open=${a.id}`);
    else if (a.act === "open-errand") router.push(`/errands?open=${a.id}`);
    else if (a.act === "nudge-quote") router.push("/quotes");
    else if (a.act === "open-health") router.push("/health");
    else if (a.act === "open-restock") router.push("/restock");
    else if (a.act === "open-return") router.push("/suluhu?tab=returns");
    else router.push(`/suppliers?id=${a.id}`);
  };
  if (!L.length) return <Empty title="All clear">Nothing needs a person right now.</Empty>;
  return (<div className="list">{L.map((a) => (
    <div key={a.act + a.id} className="alert"><span className={`ic ${a.cls}`}><Icon name={a.icon} /></span><div className="min-w-0"><b>{a.t}</b><small>{a.s}</small></div><button className="btn sm" onClick={() => run(a)}>{a.label}</button></div>
  ))}</div>);
}

export default function Overview() {
  const db = useDb()!; const { dialog } = useOverlay(); const router = useRouter();
  useEffect(() => { db.events.forEach((e) => { e.fresh = false; }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const s = stats(db);
  const R = db.riders.filter(inHub); const online = R.filter((r) => r.status === "online" || r.status === "busy").length; const busy = R.filter((r) => r.status === "busy").length;
  const openReq = db.requests.filter((q) => q.status === "open" && inHub(q)).length; const openDis = db.disputes.filter((d) => d.status !== "resolved").length;
  const hr = new Date().getHours(); const hello = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const top = useMemo(() => VERIFIED_IDS.map((id) => { const O = db.orders.filter((o) => o.sid === id && STATUS[o.status].step >= 2); return { s: sup(id), n: O.length, v: O.reduce((a, o) => a + o.itemsTotal, 0) }; }).filter((x) => inHub(x.s)).sort((a, b) => b.v - a.v).slice(0, 5), [db.orders.length, db.ui.hub]); // eslint-disable-line react-hooks/exhaustive-deps
  const mxv = Math.max(...top.map((x) => x.v), 1);
  const reqs = db.requests.filter(inHub); const rq = reqs.length, qd = reqs.filter((q) => q.quotes > 0).length;
  const fun: [string, number][] = [["Requests", rq * 14], ["Quoted", qd * 14 - 20], ["Orders placed", s.n], ["Paid to supplier", s.paid], ["Delivered", s.delivered]];
  const todaySpark = db.hourly.today.slice(5, 21).filter((_, i) => i < Math.max(2, hr - 4));
  return (
    <>
      <PageHead title={`${hello}, Rashid`} sub={`${db.ui.hub === "All" ? "Eastleigh and Kamukunji" : db.ui.hub} today.`}>
        <PermButton perm="config" onClick={() => dialog((close) => <BroadcastDialog close={close} />)}><Icon name="send" small /> Broadcast message</PermButton>
      </PageHead>
      <Banner><b>Sample data.</b> Riders, orders and payments move every few seconds so you can see how the console behaves. Actions you take here change this demo only.</Banner>

      <section className="now" aria-label="Right now">
        <div className="radar"><h2>Hub radar</h2><p>Live rider positions. Schematic, not to scale.</p><Radar db={db} />
          <div className="legend"><span><i style={{ background: "#fff" }} />Rider available</span><span><i style={{ background: "#FA3F0A" }} />Rider on a job</span><span><i style={{ background: "#F4F2EE", borderRadius: 2 }} />Supplier stall</span><span><i style={{ border: "2px solid #FA3F0A", background: "none" }} />Drop-off</span><span><i style={{ border: "2px solid #FFD166", background: "none" }} />Waiting for a rider</span></div>
        </div>
        <div className="nums">
          <div><b className="num">{s.flight}</b><span>Orders in flight</span><Link href="/orders">See orders</Link></div>
          <div><b className="num">{busy}<em>/</em>{online}</b><span>Riders on a job / online</span><Link href="/riders">Open dispatch</Link></div>
          <div><b className="num">{openReq}</b><span>Requests open</span><Link href="/quotes">See quotes</Link></div>
          <div><b className="num">{openDis}</b><span>Disputes open</span><Link href="/suluhu">Open desk</Link></div>
        </div>
      </section>

      <div className="grid g4">
        <div className="card kpi"><span className="k">Orders today</span><span className="v num">{s.n}</span><span className="d up"><Icon name="arrowup" small /> 12% vs yesterday</span><Spark vals={todaySpark.length > 1 ? todaySpark : [1, 2]} /></div>
        <div className="card kpi"><span className="k">GEKEL fees collected</span><span className="v num">{money(s.fee)}</span><span className="d up"><Icon name="arrowup" small /> 98% of STK pushes succeed</span><Spark vals={[3, 5, 4, 7, 6, 9, 8, 11, 10, 13]} /></div>
        <div className="card kpi"><span className="k">Order to doorstep</span><span className="v num">{s.avg || 58} min</span><span className="d flat">Target under 75 min</span><Spark vals={[66, 64, 61, 63, 59, 60, 57, 58, 56, 58]} color="var(--ok)" /></div>
        <div className="card kpi"><span className="k">Paid straight to supplier Tills</span><span className="v num">{money(s.direct)}</span><span className="d flat">GEKEL never holds this money</span><Spark vals={[20, 28, 26, 40, 38, 52, 49, 61, 70, 74]} /></div>
      </div>

      <div className="grid g21">
        <section className="card"><header><div><h2>Orders by hour</h2><p>Today in black, yesterday dashed</p></div></header><div className="body"><HourChart db={db} /></div></section>
        <section className="card" id="alerts"><header><div><h2>Needs attention</h2><p>Rules fire on timers you set under Rules and team</p></div></header><div className="pt-2"><AlertList /></div></section>
      </div>

      <div className="grid g2">
        <section className="card"><header><div><h2>From request to doorstep</h2><p>Last 24 hours</p></div></header>
          <div className="body"><div className="funnel">{fun.map(([l, v], i) => (<div key={l} className="fr"><span>{l}</span><div className="fb"><i style={{ width: `${Math.max(3, (v / fun[0][1]) * 100)}%` }} /></div><span className="num"><b>{Math.max(0, v)}</b> <span className="muted">{i ? Math.round((v / fun[i - 1][1]) * 100) + "%" : ""}</span></span></div>))}</div></div></section>
        <section className="card"><header><div><h2>Live activity</h2><p>Every order and request, as it happens</p></div><Pill tone={db.ui.live ? "acc" : ""}>{db.ui.live ? "Live" : "Paused"}</Pill></header>
          <div className="pt-2"><div className="feed">{db.events.slice(0, 14).map((e, i) => <div key={e.at + e.txt + i} className={`it ${e.fresh ? "new" : ""}`}><time>{clock(e.at)}</time><span>{e.txt}</span></div>)}</div></div></section>
      </div>

      <section className="card"><header><div><h2>Top suppliers today</h2><p>Item value paid to their Tills</p></div><Link className="btn sm" href="/suppliers">All suppliers</Link></header>
        <div className="body"><div className="tw"><table className="t"><thead><tr><th>Supplier</th><th>Hub</th><th className="r">Paid orders</th><th style={{ width: "30%" }}>Item value</th><th className="r">Reliability</th></tr></thead>
          <tbody>{top.map((x) => (<tr key={x.s.id} onClick={() => router.push(`/suppliers?id=${x.s.id}`)} data-row><td><b>{x.s.name}</b></td><td>{x.s.hub}</td><td className="r num">{x.n}</td><td><div className="flex items-center gap-2.5"><div className="bar acc flex-1"><i style={{ width: `${(x.v / mxv) * 100}%` }} /></div><span className="num min-w-[90px] text-right">{money(x.v)}</span></div></td><td className="r num">{x.s.score}</td></tr>))}</tbody></table></div></div></section>
    </>
  );
}

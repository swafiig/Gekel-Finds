"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Drawer, useOverlay } from "@/components/Overlay";
import { Banner, Chips, Empty, PageHead, PermButton, Pill, StatusPill } from "@/components/ui";
import { AssignDialog } from "./dialogs";
import { dueTone } from "./helpers";
import { autoAssignAll, messageRider, reinstateRider, suspendRider } from "@/lib/actions";
import { ageCls, ageTxt, minsSince, money } from "@/lib/format";
import { inHub, nearestRider, ord, rid, since, sup, useDb } from "@/lib/store";
import type { Rider } from "@/lib/types";

type F = "all" | "free" | "job" | "off" | "held";
const stat = (r: Rider) => r.status === "suspended" ? <Pill tone="bad">Suspended</Pill> : r.status === "offline" ? <Pill plain>Offline</Pill> : r.job ? <Pill tone="acc">On a job</Pill> : <Pill tone="ok">Available</Pill>;
const flt: Record<F, (r: Rider) => boolean> = { all: () => true, free: (r) => r.status === "online" && !r.job, job: (r) => !!r.job, off: (r) => r.status === "offline", held: (r) => r.status === "suspended" };
const LAB: Record<F, string> = { all: "All", free: "Available", job: "On a job", off: "Offline", held: "Suspended" };

export default function Riders() {
  const db = useDb()!; const router = useRouter(); const path = usePathname(); const sp = useSearchParams(); const { toast, dialog } = useOverlay(); const [f, setF] = useState<F>("all");
  const R = db.riders.filter(inHub); const rows = R.filter(flt[f]);
  const queue = db.orders.filter((o) => inHub(o) && ["ready", "packed"].includes(o.status) && !o.rider);
  const openId = sp.get("open"); const open = openId ? rid(openId) : undefined;
  return (
    <>
      <PageHead title="Riders and dispatch" sub="Who is online, who is carrying what, and which orders still need a rider." />
      <section className="card">
        <header><div><h2>Dispatch queue</h2><p>Orders ready or nearly ready with no rider. Nearest free rider first.</p></div>
          <PermButton perm="orders" className="btn sm primary" onClick={() => { const n = autoAssignAll(inHub); toast(n ? `${n} order${n > 1 ? "s" : ""} assigned` : "No free riders right now", n ? "" : "bad"); }}><Icon name="zap" small /> Auto-assign all</PermButton></header>
        {queue.length ? (
          <div className="tw"><table className="t"><thead><tr><th>Order</th><th>Pickup</th><th>Drop-off</th><th>Status</th><th className="r">Waiting</th><th /></tr></thead>
            <tbody>{queue.map((o) => { const n = nearestRider(o); return (
              <tr key={o.id}><td><span className="id">{o.code}</span></td><td>{sup(o.sid).name}</td><td>{o.area}</td><td><StatusPill o={o} /></td><td className={`r num ${ageCls(minsSince(since(o)), 3, 8)}`}>{ageTxt(since(o))}</td>
                <td className="r"><PermButton perm="orders" className="btn sm" onClick={() => dialog((close) => <AssignDialog order={o} close={close} onDone={(nm) => toast(`${nm} assigned to ${o.code}`)} />)}>{n ? "Nearest: " + n.name.split(" ")[0] : "Choose rider"}</PermButton></td></tr>); })}</tbody></table></div>
        ) : <Empty title="Every ready order has a rider">New ones show up here as suppliers mark them ready.</Empty>}
      </section>
      <section className="card">
        <div className="toolbar"><Chips<F> items={(Object.keys(LAB) as F[]).map((k) => [k, LAB[k], R.filter(flt[k]).length])} value={f} onChange={setF} /></div>
        <div className="tw"><table className="t"><thead><tr><th>Rider</th><th>Vehicle</th><th>Status</th><th>Current job</th><th className="r">Trips today</th><th className="r">Earned today</th><th className="r">Rating</th><th>Insurance</th></tr></thead>
          <tbody>{rows.map((r) => { const o = r.job ? ord(r.job.order) : undefined; return (
            <tr key={r.id} data-row onClick={() => router.replace(`${path}?open=${r.id}`, { scroll: false })}>
              <td><span className="two"><b>{r.name}</b><small>{r.hub}</small></span></td><td><span className="two"><span>{r.vehicle}</span><small>{r.plate}</small></span></td><td>{stat(r)}</td>
              <td>{o ? <span className="two"><span className="id">{o.code}</span><small>{r.job!.phase === "pickup" ? "Going to pickup" : "Delivering"}</small></span> : <span className="muted">-</span>}</td>
              <td className="r num">{r.trips}</td><td className="r num">{money(r.earn)}</td><td className="r num">{r.rating.toFixed(1)}</td><td><Pill tone={dueTone(r.insurance)}>{r.insurance} days</Pill></td></tr>); })}</tbody></table></div>
      </section>
      <RiderDrawer rider={open} onClose={() => router.replace(path, { scroll: false })} />
    </>
  );
}

function RiderDrawer({ rider: r, onClose }: { rider?: Rider; onClose: () => void }) {
  const router = useRouter(); const { toast, confirm } = useOverlay(); const db = useDb()!;
  if (!r) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const o = r.job ? ord(r.job.order) : undefined; const done = db.orders.filter((x) => x.rider === r.id && x.status === "delivered").slice(0, 4);
  return (
    <Drawer open onClose={onClose} title={r.name} sub={<>{stat(r)}<span className="muted">{r.vehicle} · {r.plate}</span></>}
      footer={<>
        <PermButton perm="riders" onClick={() => confirm({ title: `Message ${r.name}`, text: `Sent to ${r.phone} by SMS and push.`, label: "Send message", field: { label: "Message", placeholder: "Keep it short." }, onOk: (m) => { messageRider(r.name, m); toast("Message sent"); } })}><Icon name="msg" small /> Message rider</PermButton>
        {r.status === "suspended"
          ? <PermButton perm="riders" className="btn primary" onClick={() => { reinstateRider(r.id); toast(`${r.name} reinstated. They can go online.`); }}>Reinstate</PermButton>
          : <PermButton perm="riders" className="btn danger" onClick={() => confirm({ title: `Suspend ${r.name}?`, text: r.job ? "They are on a job. It will be returned to the dispatch queue." : "They go offline and cannot go online until reinstated.", label: "Suspend rider", danger: true, field: { label: "Reason", placeholder: "For example: delivery photo reused." }, onOk: (why) => { suspendRider(r.id, why); toast(`${r.name} suspended`); } })}>Suspend rider</PermButton>}
      </>}>
      {r.note && <div className="mx-5 mt-4"><Banner icon="shield" warn>{r.note}</Banner></div>}
      <div className="sect"><h3>Today</h3><div className="kv"><div><small>Status</small>{stat(r)}</div><div><small>Rating</small><b className="num">{r.rating.toFixed(1)}</b></div><div><small>Trips today</small><b className="num">{r.trips}</b></div><div><small>Earned today</small><b className="num">{money(r.earn)}</b></div><div><small>Lifetime trips</small><b className="num">{r.total.toLocaleString("en-KE")}</b></div><div><small>Phone</small><b className="num">{r.phone}</b></div></div></div>
      {o && <div className="sect"><h3>Current job</h3><Banner icon="bike"><b>{o.code}</b> · {sup(o.sid).name} to {o.area}. {r.job!.phase === "pickup" ? "Heading to pickup." : "On the way to the customer."} <button className="btn sm ml-2" onClick={() => router.push(`/orders?open=${o.id}`)}>Open</button></Banner></div>}
      <div className="sect"><h3>Documents</h3>
        {([["Driving licence", r.licence], ["Insurance", r.insurance]] as [string, number][]).map(([l, d]) => <div key={l} className="flex items-center justify-between"><span>{l}</span><Pill tone={dueTone(d)}>{d <= 0 ? "Expired" : `Expires in ${d} days`}</Pill></div>)}
        <div className="muted">Riders are taken offline automatically when a document expires.</div></div>
      <div className="sect"><h3>Recent deliveries</h3>{done.length ? done.map((x) => <div key={x.id} className="flex justify-between"><span>{x.code} · {x.area}</span><span className="muted">{ageTxt(x.createdAt)} ago</span></div>) : <div className="muted">None today.</div>}</div>
    </Drawer>
  );
}

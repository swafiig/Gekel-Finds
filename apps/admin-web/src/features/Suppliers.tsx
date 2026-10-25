"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useOverlay } from "@/components/Overlay";
import { Banner, Bar, Empty, PageHead, PermButton, Pill, StatusPill, Tabs } from "@/components/ui";
import { DOCS, approveSupplier, askSupplier, docDone, messageSupplier, reinstateSupplier, rejectSupplier, saveNote, setDoc, suspendSupplier } from "@/lib/actions";
import { ageCls, ageTxt, money } from "@/lib/format";
import { inHub, sup, useDb } from "@/lib/store";
import type { DocState, Supplier } from "@/lib/types";
import { scoreTone } from "./helpers";

type Tab = "queue" | "all" | "held";
const docPill = (v: DocState | undefined) => v === "ok" ? <Pill tone="ok">Verified</Pill> : v === "check" ? <Pill tone="bad">Mismatch</Pill> : v === "done" ? <Pill tone="ok">Done</Pill> : <Pill tone="warn">To do</Pill>;

export default function Suppliers() {
  const db = useDb()!; const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const param = sp.get("id"); const initial = param ? sup(param) : undefined;
  const [tab, setTab] = useState<Tab>(initial ? (initial.status === "pending" ? "queue" : initial.status === "suspended" ? "held" : "all") : "queue");
  const [q, setQ] = useState(""); const [selId, setSelId] = useState<string | null>(param);
  useEffect(() => { if (param) { const s = sup(param); if (s) { setTab(s.status === "pending" ? "queue" : s.status === "suspended" ? "held" : "all"); setSelId(param); } } }, [param]);
  const L = db.suppliers.filter(inHub);
  const lists: Record<Tab, Supplier[]> = { queue: L.filter((s) => s.status === "pending").sort((a, b) => (b.submitted ?? 0) - (a.submitted ?? 0)), all: L.filter((s) => s.status === "verified"), held: L.filter((s) => s.status === "suspended") };
  const needle = q.toLowerCase(); const rows = lists[tab].filter((s) => !needle || `${s.name} ${s.owner} ${s.till}`.toLowerCase().includes(needle));
  const s = rows.find((x) => x.id === selId) ?? rows[0];
  const pick = (id: string) => { setSelId(id); if (param) router.replace(path, { scroll: false }); };
  return (
    <>
      <PageHead title="Suppliers" sub="Review new stalls, watch reliability, and suspend when seals or payments go wrong." />
      <div className="split">
        <section className="card">
          <Tabs<Tab> tabs={[["queue", "Review queue", lists.queue.length], ["all", "Verified", lists.all.length], ["held", "Suspended", lists.held.length]]} value={tab} onChange={(t) => { setTab(t); setSelId(null); }} />
          <div className="toolbar"><input className="input w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, owner, Till" aria-label="Search suppliers" /></div>
          <div className="queue">{rows.length ? rows.map((x) => <Item key={x.id} x={x} current={s?.id === x.id} onPick={() => pick(x.id)} />) : <Empty title={tab === "queue" ? "Queue is clear" : "Nobody here"}>{tab === "queue" ? "No stalls are waiting for review." : "Nothing matches."}</Empty>}</div>
        </section>
        <section className="card detail">{s ? (s.status === "pending" ? <Pending s={s} /> : <Active s={s} onTab={setTab} />) : <Empty title="Pick a supplier">Details and actions appear here.</Empty>}</section>
      </div>
    </>
  );
}

function Item({ x, current, onPick }: { x: Supplier; current: boolean; onPick: () => void }) {
  const done = x.docs ? Object.values(x.docs).filter((v) => v === "ok" || v === "done").length : 0;
  const sub = x.status === "pending" ? <span className={ageCls(x.submitted ?? 0, 24 * 60, 48 * 60)}>Waiting {Math.floor((x.submitted ?? 0) / 60)}h</span> : x.status === "verified" ? <span className="muted">{x.orders} orders</span> : <Pill tone="bad">Suspended</Pill>;
  return (
    <button className="qi" onClick={onPick} aria-current={current}>
      <div className="row"><b>{x.name}</b>{x.status === "verified" ? <span className={`pill ${scoreTone(x.score)} nodot num`}>{x.score}</span> : sub}</div>
      <div className="row"><span className="muted">{x.hub} · {x.owner}</span>{x.status === "pending" ? <span className="muted num">{done}/5 checks</span> : sub}</div>
      {x.risk && x.risk.length > 0 && <span className="pill warn"><Icon name="alert" small /> {x.risk.length} flag</span>}
    </button>
  );
}

function Pending({ s }: { s: Supplier }) {
  const { toast, confirm } = useOverlay(); const all = DOCS.every(([k]) => docDone(s.docs?.[k]));
  return (
    <>
      <div className="sect">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="big">{s.name}</h2><div className="muted">{s.owner} · {s.stall} · {s.phone}</div></div><Pill tone="warn">Pending review</Pill></div>
        <div className="kv"><div><small>Hub</small><b>{s.hub}</b></div><div><small>Till number</small><b className="num">{s.till}</b></div><div><small>Name on Till</small><b>{s.tillName}</b></div><div><small>Submitted</small><b>{Math.floor((s.submitted ?? 0) / 60)}h ago</b></div></div>
      </div>
      {(s.risk?.length ?? 0) > 0 && <div className="sect"><h3>Flags to check</h3>{s.risk!.map((r) => <Banner key={r} warn>{r}</Banner>)}</div>}
      <div className="sect"><h3>Checklist</h3>
        {DOCS.map(([k, l, d]) => {
          const v = s.docs?.[k]; const done = docDone(v);
          return (
            <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1.5">
              <div><b>{l}</b><div className="muted">{d}</div>{k === "visit" && s.visit && <div>{s.visit}</div>}</div>
              <div className="flex items-center gap-2">{docPill(v)}{done ? <PermButton perm="suppliers" className="btn sm ghost" onClick={() => setDoc(s, k, "todo")}>Undo</PermButton> : <PermButton perm="suppliers" className="btn sm" onClick={() => setDoc(s, k, k === "visit" ? "done" : "ok")}>Mark {k === "visit" ? "done" : "verified"}</PermButton>}</div>
            </div>
          );
        })}
      </div>
      <div className="sect"><h3>Notes for the team</h3><textarea className="input" value={s.notes ?? ""} onChange={(e) => saveNote(s, e.target.value)} placeholder="What did you check? Anything the next reviewer should know?" /></div>
      <div className="sect flex flex-wrap gap-2.5">
        <PermButton perm="suppliers" className="btn primary" onClick={() => { const left = DOCS.filter(([k]) => !docDone(s.docs?.[k])).map((d) => d[1]); if (left.length) { toast(`Finish first: ${left.join(", ")}`, "bad"); return; }
          confirm({ title: `Activate ${s.name}?`, text: `They can start quoting buyers right away. Payments go straight to Till ${s.till} (${s.tillName}). GEKEL never holds this money.`, label: "Approve and activate", onOk: () => { approveSupplier(s); toast(`${s.name} is live`); } }); }} title={all ? undefined : "Finish the checklist first"}><Icon name="check" small /> Approve and activate</PermButton>
        <PermButton perm="suppliers" onClick={() => confirm({ title: `Ask ${s.owner} for more information`, text: "We send this by SMS and in the supplier app. The application stays in the queue.", label: "Send request", field: { label: "What do you need?", placeholder: "For example: please send a photo of your business registration." }, onOk: (m) => { askSupplier(s, m); toast("Request sent"); } })}><Icon name="msg" small /> Ask for more information</PermButton>
        <PermButton perm="suppliers" className="btn danger" onClick={() => confirm({ title: `Reject ${s.name}?`, text: "They will get an SMS with your reason and can reapply.", label: "Reject application", danger: true, field: { label: "Reason sent to the applicant", placeholder: "For example: the business permit has expired." }, onOk: (r) => { rejectSupplier(s, r); toast(`${s.name} rejected`); } })}>Reject</PermButton>
      </div>
    </>
  );
}

function Active({ s, onTab }: { s: Supplier; onTab: (t: Tab) => void }) {
  const db = useDb()!; const router = useRouter(); const { toast, confirm } = useOverlay();
  const O = db.orders.filter((o) => o.sid === s.id); const open = O.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  return (
    <>
      <div className="sect">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="big">{s.name}</h2><div className="muted">{s.owner} · {s.stall} · {s.phone}</div></div>{s.status === "suspended" ? <Pill tone="bad">Suspended</Pill> : <Pill tone="ok">Verified</Pill>}</div>
        {s.note && <Banner icon="shield" warn>{s.note}</Banner>}
      </div>
      <div className="sect"><h3>Performance</h3>
        <div className="grid g3 gap-2.5">
          <div className="card flat kpi"><span className="k">Reliability score</span><span className="v num">{s.score}</span><Bar pct={s.score ?? 0} tone={scoreTone(s.score)} /></div>
          <div className="card flat kpi"><span className="k">Dispute rate</span><span className="v num">{s.disputeRate}%</span><span className={`d ${(s.disputeRate ?? 0) > 3 ? "down" : "flat"}`}>{(s.disputeRate ?? 0) > 3 ? "Above the 3% limit" : "Within the 3% limit"}</span></div>
          <div className="card flat kpi"><span className="k">Median quote time</span><span className="v num">{s.quoteMins} min</span><span className="d flat">Window is {db.config.quoteWindow} seconds to start</span></div>
        </div>
        <div className="kv"><div><small>Till number</small><b className="num">{s.till}</b></div><div><small>Lifetime orders</small><b className="num">{s.orders}</b></div><div><small>Open orders now</small><b className="num">{open}</b></div><div><small>On GEKEL for</small><b>{s.joined} days</b></div></div>
      </div>
      <div className="sect"><h3>Recent orders</h3>
        {O.slice(0, 5).length ? <div className="list">{O.slice(0, 5).map((o) => (
          <button key={o.id} className="alert w-full border-0 bg-transparent text-left" onClick={() => router.push(`/orders?open=${o.id}`)}><span className="ic"><Icon name="orders" /></span><div><b>{o.code} · {o.buyer}</b><small>{money(o.itemsTotal)} · {ageTxt(o.createdAt)} ago</small></div><StatusPill o={o} /></button>
        ))}</div> : <div className="muted">No orders yet.</div>}
      </div>
      <div className="sect flex flex-wrap gap-2.5">
        <PermButton perm="suppliers" onClick={() => confirm({ title: `Message ${s.name}`, text: `Sent to ${s.phone} by SMS and in the app.`, label: "Send message", field: { label: "Message", placeholder: "Write a short, clear message." }, onOk: (m) => { messageSupplier(s, m); toast("Message sent"); } })}><Icon name="msg" small /> Message supplier</PermButton>
        {s.status === "suspended"
          ? <PermButton perm="suppliers" className="btn primary" onClick={() => confirm({ title: `Reinstate ${s.name}?`, text: "They can quote again right away.", label: "Reinstate", onOk: () => { reinstateSupplier(s); toast(`${s.name} reinstated`); onTab("all"); } })}>Reinstate</PermButton>
          : <PermButton perm="suppliers" className="btn danger" onClick={() => confirm({ title: `Suspend ${s.name}?`, text: `They stop receiving requests straight away. ${open ? open + " open order" + (open > 1 ? "s" : "") + " will finish as normal." : "They have no open orders."}`, label: "Suspend supplier", danger: true, field: { label: "Reason (shown to the supplier)", placeholder: "For example: three tamper-seal mismatches in 14 days." }, onOk: (r) => { suspendSupplier(s, r); toast(`${s.name} suspended`); onTab("held"); } })}>Suspend supplier</PermButton>}
      </div>
    </>
  );
}

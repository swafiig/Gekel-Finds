"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useOverlay } from "@/components/Overlay";
import { Empty, PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { ProofFrame } from "./ProofFrame";
import { replyDispute, ruleDispute, rulingText, type Ruling } from "@/lib/actions";
import { ageTxt, money } from "@/lib/format";
import { ord, rid, sup, useDb } from "@/lib/store";
import type { Dispute } from "@/lib/types";

const sevPill = (s: Dispute["sev"]) => <Pill tone={s === "high" ? "bad" : s === "med" ? "warn" : ""}>{s === "high" ? "High" : s === "med" ? "Medium" : "Low"}</Pill>;
function Sla({ d }: { d: Dispute }) {
  if (d.status === "resolved") return <span className="muted">Resolved</span>;
  const m = Math.round((d.sla - Date.now()) / 60000);
  if (m < 0) return <span className="age hot">{-m}m over SLA</span>;
  return <span className={m < 25 ? "age hot" : m < 60 ? "age warm" : "age"}>{m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`} left</span>;
}

export default function Disputes({ embedded }: { embedded?: boolean }) {
  const db = useDb()!; const sp = useSearchParams(); const router = useRouter(); const path = usePathname();
  const param = sp.get("id"); const [tab, setTab] = useState<"open" | "done">("open"); const [selId, setSelId] = useState<string | null>(param);
  useEffect(() => { if (param) { const d = db.disputes.find((x) => x.id === param); if (d) { setTab(d.status === "resolved" ? "done" : "open"); setSelId(param); } } }, [param]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = db.disputes.filter((d) => d.status !== "resolved").sort((a, b) => a.sla - b.sla); const done = db.disputes.filter((d) => d.status === "resolved");
  const rows = tab === "open" ? open : done; const d = rows.find((x) => x.id === selId) ?? rows[0];
  return (
    <>
      {!embedded && <PageHead title="Disputes" sub="Review the proof, hear both sides, and rule before the clock runs out." />}
      <div className="split">
        <section className="card">
          <Tabs tabs={[["open", "Open", open.length], ["done", "Resolved", done.length]]} value={tab} onChange={(t) => { setTab(t); setSelId(null); }} />
          <div className="queue">{rows.length ? rows.map((x) => (
            <button key={x.id} className="qi" aria-current={d?.id === x.id} onClick={() => { setSelId(x.id); if (param) router.replace(path, { scroll: false }); }}>
              <div className="row"><b>{x.kind}</b>{sevPill(x.sev)}</div><div className="row"><span className="muted">{x.id} · {x.buyer}</span><Sla d={x} /></div>
              <span className="muted num">{money(x.amount)} · {x.sid ? sup(x.sid).name : ""}</span></button>
          )) : <Empty title={tab === "open" ? "No open disputes" : "Nothing resolved yet"}>{tab === "open" ? "Good. New cases appear here." : null}</Empty>}</div>
        </section>
        <section className="card detail">{d ? <Case d={d} /> : <Empty title="Pick a case">Evidence and rulings appear here.</Empty>}</section>
      </div>
    </>
  );
}

function Case({ d }: { d: Dispute }) {
  const router = useRouter(); const { toast, confirm } = useOverlay(); const [text, setText] = useState("");
  const o = d.order ? ord(d.order) : undefined; const r = o?.rider ? rid(o.rider) : undefined;
  const send = () => { if (!text.trim()) { toast("Write a message first", "bad"); return; } replyDispute(d, text.trim()); setText(""); };
  const rule = (k: Ruling) => { const [title, txt] = rulingText(d, k); confirm({ title: title + "?", text: txt, label: "Confirm ruling", field: { label: "Reason (both sides see this)", placeholder: "Explain the evidence you relied on." }, onOk: (note) => { ruleDispute(d, k, note); toast(`${d.id} resolved`); } }); };
  return (
    <>
      <div className="sect">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="big">{d.kind}</h2><div className="muted">{d.id} · opened by {d.openedBy.toLowerCase()} {ageTxt(d.at)} ago</div></div><div className="flex items-center gap-2">{sevPill(d.sev)}<Sla d={d} /></div></div>
        <blockquote className="m-0 rounded-md border-l-[3px] border-accent bg-surface-2 px-3.5 py-3">{d.claim}</blockquote>
        <div className="kv"><div><small>Order</small>{o ? <button className="id text-accent-ink underline" onClick={() => router.push(`/orders?open=${o.id}`)}>{o.code}</button> : "-"}</div><div><small>Buyer</small><b>{d.buyer}</b></div><div><small>Supplier</small><b>{d.sid ? sup(d.sid).name : "-"}</b></div><div><small>Rider</small><b>{r ? r.name : "-"}</b></div><div><small>At stake</small><b className="num">{money(d.amount)}</b></div></div>
      </div>
      <div className="sect"><h3>Evidence</h3><div className="frames">{d.evidence.length ? d.evidence.map((p, i) => <ProofFrame key={i} p={p} />) : <div className="muted">No photos on this case. Ask the buyer to upload one.</div>}</div></div>
      <div className="sect"><h3>Conversation</h3>
        <div className="chat">{d.chat.length ? d.chat.map(([w, n, t], i) => <div key={i} className={`bub ${w === "Support" ? "me" : ""}`}><small>{w}: {n}</small>{t}</div>) : <div className="muted">No messages yet.</div>}</div>
        {d.status !== "resolved" && <div className="flex gap-2"><input className="input flex-1" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write to the buyer, supplier and rider" aria-label="Reply" /><PermButton perm="disputes" onClick={send}>Send</PermButton></div>}</div>
      {d.status === "resolved"
        ? <div className="sect"><h3>Ruling</h3><div className="banner m-0"><span><b>{d.ruling}</b>. {d.note}</span></div></div>
        : <div className="sect"><h3>Rule on this case</h3><div className="muted">GEKEL does not hold item money. Rulings that return item money are paid by the supplier directly to the buyer. GEKEL can refund its own fee.</div>
          <div className="flex flex-wrap gap-2.5">
            <PermButton perm="disputes" className="btn primary" onClick={() => rule("buyer")}>Side with buyer</PermButton><PermButton perm="disputes" onClick={() => rule("supplier")}>Side with supplier</PermButton><PermButton perm="disputes" onClick={() => rule("split")}>Split</PermButton><PermButton perm="disputes" onClick={() => rule("fee")}>Refund GEKEL fee only</PermButton><PermButton perm="disputes" className="btn ghost" onClick={() => rule("dismiss")}>Dismiss</PermButton>
          </div></div>}
    </>
  );
}

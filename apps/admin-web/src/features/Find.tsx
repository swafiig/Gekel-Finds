"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOpenId } from "@/components/hooks";
import { Drawer, useOverlay } from "@/components/Overlay";
import { Empty, Field, Kpi, PageHead, PermButton, Pill, Stages, Tabs } from "@/components/ui";
import { advanceFind, assignFind, closeFind, inviteFoundSupplier, noteFind, recordFound, reopenFind } from "@/lib/actions2";
import { useStaff } from "@/lib/auth";
import { ageTxt, clock, initials, money } from "@/lib/format";
import { can, inHub, useDb } from "@/lib/store";
import { FIND_STAGES, type FindReq } from "@/lib/types";
import { dayOf, finders } from "./helpers";

type View = "board" | "list" | "closed";
const dayTone = (f: FindReq) => (f.closed ? "" : dayOf(f.createdAt) >= 3 ? "bad" : dayOf(f.createdAt) === 2 ? "warn" : "");

export default function Find() {
  const db = useDb()!; useStaff(); const [openId, setOpen, close] = useOpenId(); const [view, setView] = useState<View>("board"); const [who, setWho] = useState("all"); const [q, setQ] = useState("");
  const all = db.finds.filter(inHub); const active = all.filter((f) => !f.closed); const closed = all.filter((f) => f.closed);
  const match = (f: FindReq) => (who === "all" || (who === "none" ? !f.agent : f.agent === who)) && (!q.trim() || `${f.code} ${f.title} ${f.buyer} ${f.found?.supplier ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const agents = finders(); const open = db.finds.find((f) => f.id === openId) ?? null;
  const done = all.filter((f) => f.closed === "not_found" || f.found); const foundRate = done.length ? Math.round((all.filter((f) => f.found).length / done.length) * 100) : 0;
  const same = active.filter((f) => f.urgency === "sameDay" && f.stage < 2).length;
  const hrs = (() => { const x = all.filter((f) => f.found).map((f) => (f.found!.at - f.createdAt) / 3600000); return x.length ? Math.round((x.reduce((a, b) => a + b, 0) / x.length) * 10) / 10 : 0; })();
  return (
    <>
      <PageHead title="Find GEKEL" sub="Buyers ask GEKEL for things they cannot find in the app. Our agents search the markets, report back, and the buyer approves the price. The buyer is told within three days." />
      <div className="grid g4">
        <Kpi k="Open requests" v={active.length} d={`${active.filter((f) => !f.agent).length} with no agent yet`} />
        <Kpi k="Same-day, not yet found" v={same} d={same ? "Work these first" : "None waiting"} tone={same ? "down" : "up"} />
        <Kpi k="Found rate" v={`${foundRate}%`} d={`${closed.filter((f) => f.closed === "not_found").length} not found so far`} />
        <Kpi k="Average time to find" v={`${hrs} h`} d="From request to supplier located" />
      </div>
      <section className="card">
        <Tabs<View> tabs={[["board", "Board", active.length], ["list", "List"], ["closed", "Closed", closed.length]]} value={view} onChange={setView} />
        <div className="toolbar">
          <input className="input" placeholder="Search item, buyer, code, supplier" aria-label="Search finds" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" style={{ maxWidth: 200 }} aria-label="Agent" value={who} onChange={(e) => setWho(e.target.value)}><option value="all">All agents</option><option value="none">Unassigned</option>{agents.map((a) => <option key={a}>{a}</option>)}</select>
        </div>
        {view === "board" ? (
          <div className="board">{FIND_STAGES.map((s, i) => { const L = active.filter((f) => f.stage === i && match(f)); return (
            <div key={s} className="col"><h4>{s}<span className="n">{L.length}</span></h4>
              {L.map((f) => <FindCard key={f.id} f={f} onOpen={() => setOpen(f.id)} />)}{!L.length && <div className="muted px-1 text-[13px]">Nothing here</div>}</div>); })}</div>
        ) : (
          <FindTable rows={(view === "list" ? all : closed).filter(match)} onOpen={(id) => setOpen(id)} />
        )}
      </section>
      <FindDrawer f={open} onClose={close} agents={agents} />
    </>
  );
}

function FindCard({ f, onOpen }: { f: FindReq; onOpen: () => void }) {
  return (
    <button className="kc" onClick={onOpen}>
      <div className="row"><span className="muted num">{f.code}</span>{f.urgency === "sameDay" ? <Pill tone="acc" plain>Same day</Pill> : <span className={`age ${dayTone(f) === "bad" ? "hot" : dayTone(f) === "warn" ? "warm" : ""}`}>Day {dayOf(f.createdAt)} of 3</span>}</div>
      <b>{f.title}</b>
      <div className="row muted"><span>{f.buyer} · {f.hub}</span><span className="num">{money(f.budget)}</span></div>
      {f.found && <div className="row"><span className="ok-txt">Found {money(f.found.price)}</span><span className="muted">{f.found.supplier}</span></div>}
      <div className="row muted"><span>{ageTxt(f.createdAt)} ago{f.hasPhoto ? " · photo" : ""}</span>{f.agent ? <span className="av sm" title={f.agent}>{initials(f.agent)}</span> : <span className="age warm">No agent</span>}</div>
    </button>
  );
}

function FindTable({ rows, onOpen }: { rows: FindReq[]; onOpen: (id: string) => void }) {
  if (!rows.length) return <Empty title="Nothing here">No requests match.</Empty>;
  return (
    <div className="tw"><table className="t"><thead><tr><th>Request</th><th>Buyer</th><th>Stage</th><th>Agent</th><th className="r">Budget</th><th className="r">Found for</th><th className="r">Age</th></tr></thead>
      <tbody>{rows.map((f) => (
        <tr key={f.id} data-row onClick={() => onOpen(f.id)}><td><span className="two"><b>{f.title}</b><small className="num">{f.code} · {f.category}</small></span></td><td>{f.buyer}</td>
          <td>{f.closed ? <Pill tone="bad">{f.closed === "not_found" ? "Not found" : "Cancelled"}</Pill> : <Pill tone={f.stage >= 5 ? "ok" : f.stage >= 2 ? "acc" : ""}>{FIND_STAGES[f.stage]}</Pill>}</td>
          <td>{f.agent ?? <span className="muted">None</span>}</td><td className="r num">{money(f.budget)}</td><td className="r num">{f.found ? money(f.found.price) : "-"}</td><td className="r num">{ageTxt(f.createdAt)}</td></tr>))}</tbody></table></div>
  );
}

function FindDrawer({ f, onClose, agents }: { f: FindReq | null; onClose: () => void; agents: string[] }) {
  const { toast, confirm } = useOverlay(); const db = useDb()!; const [note, setNote] = useState(""); const [form, setForm] = useState({ supplier: "", stall: "", phone: "", price: "" }); const [err, setErr] = useState("");
  if (!f) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const isClosed = !!f.closed; const price = parseFloat(form.price);
  const save = () => {
    if (!form.supplier.trim() || !form.stall.trim() || !(price > 0)) { setErr("Add the supplier, where to find them, and a price."); return; }
    recordFound(f, { supplier: form.supplier.trim(), stall: form.stall.trim(), phone: form.phone.trim(), price }); setForm({ supplier: "", stall: "", phone: "", price: "" }); setErr(""); toast(`Sent to ${f.buyer} to approve`);
  };
  const next: Record<number, string> = { 2: "Buyer approved", 3: "Mark bought and packed", 4: "Mark delivered" };
  return (
    <Drawer open onClose={onClose} title={f.title} sub={<><span className="muted num">{f.code}</span>{isClosed ? <Pill tone="bad">{f.closed === "not_found" ? "Not found" : "Cancelled"}</Pill> : <Pill tone="acc">{FIND_STAGES[f.stage]}</Pill>}{f.urgency === "sameDay" && <Pill tone="acc" plain>Same day</Pill>}</>}
      footer={isClosed ? <PermButton perm="sourcing" onClick={() => { reopenFind(f); toast("Reopened"); }}>Reopen</PermButton> : (<>
        {next[f.stage] && <PermButton perm="sourcing" className="btn primary" onClick={() => { advanceFind(f); toast(`${f.code}: ${FIND_STAGES[f.stage]}`); }}>{next[f.stage]}</PermButton>}
        <PermButton perm="sourcing" onClick={() => confirm({ title: "Could not find it?", text: `${f.buyer} is told we could not find this and is not charged the find fee.`, label: "Close as not found", danger: true, field: { label: "What did you try?", placeholder: "Markets and stalls checked, closest price found" }, onOk: (r) => { closeFind(f, "not_found", r); toast("Closed. Buyer told."); } })}>Not found</PermButton>
        <PermButton perm="sourcing" className="btn ghost" onClick={() => confirm({ title: "Cancel this request?", text: "Use this when the buyer changed their mind.", label: "Cancel request", danger: true, field: { label: "Reason", placeholder: "Buyer cancelled by phone" }, onOk: (r) => { closeFind(f, "cancelled", r); toast("Cancelled"); } })}>Cancel</PermButton></>)}>
      <div className="sect"><h3>Request</h3>
        <div className="kv"><div><small>Buyer</small><b>{f.buyer}</b></div><div><small>Phone</small><b className="num">{f.phone}</b></div><div><small>Budget</small><b className="num">{money(f.budget)}</b></div><div><small>Hub</small><b>{f.hub}</b></div><div><small>Category</small><b>{f.category}</b></div><div><small>Asked</small><b>{ageTxt(f.createdAt)} ago{f.hasPhoto ? ", photo attached" : ""}</b></div></div>
        {f.detail && <p className="soft m-0">{f.detail}</p>}
      </div>
      <div className="sect"><h3>Agent</h3>
        <div className="flex flex-wrap gap-2 items-center"><select className="input" style={{ maxWidth: 240 }} aria-label="Assign agent" disabled={isClosed} value={f.agent ?? ""} onChange={(e) => { if (!can("sourcing")) { toast("Your role cannot assign finders.", "bad"); return; } if (e.target.value) { assignFind(f, e.target.value); toast(`Assigned to ${e.target.value}`); } }}><option value="">Not assigned</option>{agents.map((a) => <option key={a}>{a}</option>)}</select>
          <a className="btn sm" href={`tel:${f.phone.replace(/\s/g, "")}`}><Icon name="phone" small /> Call buyer</a></div>
      </div>
      {f.found ? (
        <div className="sect"><h3>What we found</h3>
          <div className="kv"><div><small>Supplier</small><b>{f.found.supplier}</b></div><div><small>Where</small><b>{f.found.stall}</b></div><div><small>Their phone</small><b className="num">{f.found.phone || "-"}</b></div><div><small>Price to buyer</small><b className="num">{money(f.found.price)} + {money(db.config.findFee)} find fee</b></div></div>
          <div className="flex gap-2 flex-wrap">{!f.invited ? <PermButton perm="suppliers" className="btn sm" onClick={() => { inviteFoundSupplier(f); toast(`${f.found!.supplier} added to the onboarding queue`); }}><Icon name="store" small /> Invite to join GEKEL</PermButton> : <Pill tone="ok">Invited to join</Pill>}</div>
        </div>
      ) : !isClosed && (
        <div className="sect"><h3>Record what the agent found</h3>
          <div className="grid g2"><Field id="fs" label="Supplier or stall name"><input id="fs" className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
            <Field id="fw" label="Where to find them"><input id="fw" className="input" placeholder="Market, row, stall" value={form.stall} onChange={(e) => setForm({ ...form, stall: e.target.value })} /></Field>
            <Field id="fp" label="Their phone"><input id="fp" className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field id="fx" label="Price for the item (KSh)"><input id="fx" className="input num" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field></div>
          {price > 0 && <p className="hint m-0">Buyer sees {money(price)} + {money(db.config.findFee)} find fee, plus delivery.</p>}
          {err && <span className="errtxt">{err}</span>}
          <div><PermButton perm="sourcing" className="btn primary" onClick={save}>Send to buyer to approve</PermButton></div>
        </div>
      )}
      <div className="sect"><h3>Progress</h3><Stages stages={FIND_STAGES} at={f.stage} closed={isClosed} /></div>
      <div className="sect"><h3>Notes</h3>
        {f.notes.length ? <div className="grid gap-2">{[...f.notes].reverse().map((n, i) => <div key={i} className="note"><small>{n.who} · {clock(n.at)} · {ageTxt(n.at)} ago</small>{n.t}</div>)}</div> : <span className="muted">No notes yet.</span>}
        <div className="flex gap-2"><input className="input" placeholder="Add a note for the team" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && note.trim()) { noteFind(f, note.trim()); setNote(""); } }} /><PermButton perm="sourcing" onClick={() => { if (note.trim()) { noteFind(f, note.trim()); setNote(""); } }}>Add</PermButton></div>
      </div>
    </Drawer>
  );
}

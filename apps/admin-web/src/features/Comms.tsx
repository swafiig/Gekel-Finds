"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { DialogShell, useOverlay } from "@/components/Overlay";
import { Banner, Empty, Field, Kpi, PageHead, PermButton, Pill, Tabs, Toggle } from "@/components/ui";
import { AUDIENCES, deleteTemplate, saveTemplate, sendCampaign, toggleAuto } from "@/lib/actions2";
import { ageTxt, dayClock } from "@/lib/format";
import { can, useDb } from "@/lib/store";
import type { Channel, Template } from "@/lib/types";

const CH: [Channel, string][] = [["push", "Push"], ["sms", "SMS"], ["inapp", "In-app"], ["whatsapp", "WhatsApp"]];
const SMS_PRICE = 0.8; // KSh per SMS segment: an estimate, replace with your provider's real price
const segs = (n: number) => (n === 0 ? 0 : n <= 160 ? 1 : Math.ceil(n / 153));
const groupOf = (a: string) => (/rider/i.test(a) ? "Riders" : /supplier/i.test(a) ? "Suppliers" : "Buyers");

export default function Comms() {
  const db = useDb()!; const [tab, setTab] = useState<"compose" | "sent" | "templates" | "auto">("compose");
  const [aud, setAud] = useState(AUDIENCES[1][0]); const [ch, setCh] = useState<Channel[]>(["push", "inapp"]); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [later, setLater] = useState(false); const [when, setWhen] = useState(""); const [err, setErr] = useState("");
  const { toast, confirm, dialog } = useOverlay();
  const sms = db.integrations.find((i) => i.id === "sms"); const smsOk = sms?.status === "connected" || sms?.status === "sandbox"; const wa = db.integrations.find((i) => i.id === "wa");
  const n = AUDIENCES.find((a) => a[0] === aud)![1]; const cost = ch.includes("sms") ? Math.round(n * segs(body.length) * SMS_PRICE) : 0;
  const send = () => {
    if (!ch.length) { setErr("Choose at least one way to send it."); return; } if (!body.trim()) { setErr("Write the message first."); return; } if (ch.some((c) => c === "push" || c === "inapp") && !title.trim()) { setErr("Push and in-app messages need a short title."); return; }
    let t = 0; if (later) { t = new Date(when).getTime(); if (!t || t < Date.now()) { setErr("Pick a time in the future."); return; } }
    const go = () => { sendCampaign({ audience: aud, channels: ch, title: title.trim() || body.trim().slice(0, 40), body: body.trim(), when: t }); setTitle(""); setBody(""); setErr(""); toast(later ? "Scheduled" : `Sent to ${n.toLocaleString("en-KE")} people`); setTab("sent"); };
    if (n > 100 && !later) confirm({ title: `Send to ${n.toLocaleString("en-KE")} people?`, text: `${aud}. Channels: ${ch.map((c) => CH.find((x) => x[0] === c)![1]).join(", ")}.${cost ? ` SMS cost about KSh ${cost.toLocaleString("en-KE")}.` : ""} It cannot be recalled.`, label: "Send now", onOk: go }); else go();
  };
  const useTpl = (t: Template) => { setBody(t.body); setTitle(t.name); setAud(t.group === "Suppliers" ? "All verified suppliers" : t.group === "Riders" ? "All online riders" : AUDIENCES[1][0]); setTab("compose"); };
  const editTpl = (t?: Template) => dialog((close) => <TplDialog t={t} close={close} />);
  const sent = db.campaigns.filter((c) => c.status === "sent"); const reach = sent.reduce((a, c) => a + c.sent, 0);
  return (
    <>
      <PageHead title="Messages and alerts" sub="Send a message to buyers, suppliers or riders, keep reusable templates, and control the automatic messages the apps send on their own." />
      <div className="grid g4">
        <Kpi k="Sent this week" v={sent.length} d={`${reach.toLocaleString("en-KE")} people reached`} /><Kpi k="Scheduled" v={db.campaigns.filter((c) => c.status === "scheduled").length} d="Waiting to go out" />
        <Kpi k="SMS" v={smsOk ? "Ready" : "Not set up"} d={smsOk ? "Gateway connected" : "Connect it under Integrations"} tone={smsOk ? "up" : "down"} /><Kpi k="Templates" v={db.templates.length} d="Buyers, suppliers, riders" />
      </div>
      <section className="card"><Tabs<"compose" | "sent" | "templates" | "auto"> tabs={[["compose", "Write a message"], ["sent", "Sent and scheduled", db.campaigns.length], ["templates", "Templates", db.templates.length], ["auto", "Automatic messages"]]} value={tab} onChange={setTab} />
        {tab === "compose" && (
          <div className="grid g21 p-[18px]">
            <div className="grid gap-3.5">
              <Field id="ca" label="Who gets it" hint={`${n.toLocaleString("en-KE")} people`}><select id="ca" className="input" value={aud} onChange={(e) => setAud(e.target.value)}>{(["Buyers", "Suppliers", "Riders"] as const).map((g) => <optgroup key={g} label={g}>{AUDIENCES.filter((a) => groupOf(a[0]) === g).map((a) => <option key={a[0]} value={a[0]}>{a[0]} ({a[1].toLocaleString("en-KE")})</option>)}</optgroup>)}</select></Field>
              <div className="field"><span className="lbl">How to send it</span><div className="chips">{CH.map(([k, l]) => { const off = (k === "sms" && !smsOk) || (k === "whatsapp" && wa?.status !== "connected"); return <button key={k} className="chip" disabled={off} title={off ? "Connect this under Integrations first" : undefined} aria-pressed={ch.includes(k)} onClick={() => setCh(ch.includes(k) ? ch.filter((x) => x !== k) : [...ch, k])}>{l}{off ? " (not set up)" : ""}</button>; })}</div></div>
              <Field id="ct" label="Title" hint="Shown on the notification. Not used for SMS."><input id="ct" className="input" maxLength={60} value={title} onChange={(e) => { setTitle(e.target.value); setErr(""); }} placeholder="Free delivery this weekend" /></Field>
              <Field id="cb" label="Message" hint={`${body.length} characters${ch.includes("sms") ? `, ${segs(body.length)} SMS part${segs(body.length) === 1 ? "" : "s"}` : ""}. You can use {name} and {order}.`}><textarea id="cb" className="input" style={{ minHeight: 120 }} value={body} onChange={(e) => { setBody(e.target.value); setErr(""); }} /></Field>
              <div className="flex items-center gap-3 flex-wrap"><label className="check"><input type="checkbox" checked={later} onChange={(e) => setLater(e.target.checked)} /><span>Send later</span></label>{later && <input className="input" style={{ maxWidth: 240 }} type="datetime-local" aria-label="Send at" value={when} onChange={(e) => setWhen(e.target.value)} />}</div>
              {err && <span className="errtxt">{err}</span>}
              <div className="flex gap-2 items-center flex-wrap"><PermButton perm="comms" className="btn primary" onClick={send}><Icon name="send" small /> {later ? "Schedule" : "Send"}</PermButton>{cost > 0 && <span className="muted">SMS cost about KSh {cost.toLocaleString("en-KE")} (estimate at KSh {SMS_PRICE} a part)</span>}</div>
            </div>
            <div className="grid gap-3 content-start"><h3 className="m-0 text-sm font-bold">Preview</h3>
              <div className="phone"><div className="pn"><b>{title || "Title"}</b><span>{(body || "Your message appears here.").replace("{name}", "Amina").replace("{order}", "GK-10492")}</span><small>GEKEL · now</small></div></div>
              {!smsOk && <Banner icon="alert" warn>SMS is not connected yet, so people without data will not get this. Connect it under Integrations.</Banner>}
            </div>
          </div>)}
        {tab === "sent" && (db.campaigns.length ? <div className="tw"><table className="t"><thead><tr><th>Message</th><th>To</th><th>Sent by</th><th>Status</th><th className="r">Reached</th><th className="r">Opened</th><th className="r">When</th></tr></thead>
          <tbody>{db.campaigns.map((c) => <tr key={c.id}><td><span className="two"><b>{c.title}</b><small>{c.body.length > 80 ? c.body.slice(0, 80) + "..." : c.body}</small></span></td><td><span className="two"><span>{c.audience}</span><small>{c.channels.join(", ")}</small></span></td><td>{c.by}</td><td><Pill tone={c.status === "sent" ? "ok" : c.status === "scheduled" ? "acc" : "bad"}>{c.status === "scheduled" ? "Scheduled" : c.status === "sent" ? "Sent" : "Failed"}</Pill></td>
            <td className="r num">{c.status === "scheduled" ? "-" : c.sent.toLocaleString("en-KE")}</td><td className="r num">{c.opened != null && c.sent ? `${Math.round((c.opened / c.sent) * 100)}%` : "-"}</td><td className="r num">{c.status === "scheduled" ? dayClock(c.scheduledFor!) : `${ageTxt(c.at)} ago`}</td></tr>)}</tbody></table></div> : <Empty title="Nothing sent yet">Write your first message.</Empty>)}
        {tab === "templates" && (<>
          <div className="toolbar"><span className="muted">Reusable messages. {"{name}"}, {"{order}"}, {"{item}"}, {"{date}"} and {"{days}"} are filled in for each person.</span><PermButton perm="comms" className="btn sm primary ml-auto" onClick={() => editTpl()}><Icon name="plus" small /> New template</PermButton></div>
          {(["Buyers", "Suppliers", "Riders"] as const).map((g) => <div key={g} className="sect"><h3>{g}</h3><div className="grid g2">{db.templates.filter((t) => t.group === g).map((t) => (
            <div key={t.id} className="card flat p-3.5 grid gap-2"><b>{t.name}</b><span className="soft">{t.body}</span><div className="flex gap-2"><button className="btn sm" onClick={() => useTpl(t)}>Use</button><PermButton perm="comms" className="btn sm ghost" onClick={() => editTpl(t)}>Edit</PermButton><PermButton perm="comms" className="btn sm ghost" onClick={() => confirm({ title: `Delete "${t.name}"?`, text: "Messages already sent are not affected.", label: "Delete", danger: true, onOk: () => { deleteTemplate(t.id); toast("Deleted"); } })}>Delete</PermButton></div></div>))}</div></div>)}
        </>)}
        {tab === "auto" && (<>
          <div className="toolbar"><span className="muted">Messages the apps send by themselves when something happens. Turn a way of sending off if it is too noisy or costs too much.</span></div>
          <div className="tw"><table className="t"><thead><tr><th>When this happens</th><th>Who is told</th><th className="text-center">Push</th><th className="text-center">SMS</th><th className="text-center">In-app</th></tr></thead>
            <tbody>{db.autos.map((a) => <tr key={a.id}><td><b>{a.event}</b></td><td>{a.to}</td>{(["push", "sms", "inapp"] as const).map((k) => <td key={k} className="text-center"><Toggle on={a[k]} label={`${a.event}, ${k}`} disabled={!can("comms") || (k === "sms" && !smsOk)} onChange={() => toggleAuto(a.id, k)} /></td>)}</tr>)}</tbody></table></div>
          {!smsOk && <div className="sect"><span className="muted">SMS switches are locked until the SMS gateway is connected.</span></div>}
        </>)}
      </section>
    </>
  );
}

function TplDialog({ t, close }: { t?: Template; close: () => void }) {
  const { toast } = useOverlay(); const [name, setName] = useState(t?.name ?? ""); const [group, setGroup] = useState<Template["group"]>(t?.group ?? "Buyers"); const [body, setBody] = useState(t?.body ?? ""); const [err, setErr] = useState(false);
  return (
    <DialogShell title={t ? "Edit template" : "New template"} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { if (!name.trim() || !body.trim()) { setErr(true); return; } saveTemplate({ id: t?.id ?? "t" + Date.now(), name: name.trim(), group, body: body.trim() }); close(); toast("Template saved"); }}>Save</button></>}>
      <Field id="tn" label="Name"><input id="tn" className="input" value={name} onChange={(e) => { setName(e.target.value); setErr(false); }} /></Field>
      <Field id="tg" label="For"><select id="tg" className="input" value={group} onChange={(e) => setGroup(e.target.value as Template["group"])}><option>Buyers</option><option>Suppliers</option><option>Riders</option></select></Field>
      <Field id="tb" label="Message" error={err ? "Add a name and a message." : undefined}><textarea id="tb" className="input" value={body} onChange={(e) => { setBody(e.target.value); setErr(false); }} /></Field>
    </DialogShell>
  );
}

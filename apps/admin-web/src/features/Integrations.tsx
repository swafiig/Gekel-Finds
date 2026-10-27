"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOpenId } from "@/components/hooks";
import { DialogShell, Drawer, useOverlay } from "@/components/Overlay";
import { Banner, Field, Kpi, PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { addIntegration, removeIntegration, saveIntegration, testIntegration } from "@/lib/actions2";
import { ageTxt } from "@/lib/format";
import { useDb } from "@/lib/store";
import type { Integration } from "@/lib/types";

const ST: Record<Integration["status"], [string, "ok" | "warn" | "bad" | ""]> = { connected: ["Live", "ok"], sandbox: ["Testing (sandbox)", "warn"], not_connected: ["Not connected", ""], error: ["Needs attention", "bad"] };
const CATS: Integration["cat"][] = ["Payments", "Messaging", "Maps", "Push", "Couriers", "Monitoring", "Storage", "Other"];

export default function Integrations() {
  const db = useDb()!; const { dialog } = useOverlay(); const [openId, setOpen, close] = useOpenId(); const [tab, setTab] = useState<"all" | Integration["phase"]>("all");
  const L = db.integrations; const shown = L.filter((i) => tab === "all" || i.phase === tab); const cur = L.find((i) => i.id === openId) ?? null;
  const start = L.filter((i) => i.phase === "Start here"); const ready = start.filter((i) => i.status === "connected").length;
  return (
    <>
      <PageHead title="Integrations" sub="The outside services GEKEL depends on. Start with the few that decide whether the apps work, add the rest as you grow.">
        <PermButton perm="tech" className="btn primary" onClick={() => dialog((c) => <AddDialog close={c} />)}><Icon name="plus" small /> Add another</PermButton>
      </PageHead>
      <Banner icon="lock"><b>Keys are kept on the server.</b> In this demo the console only remembers the last 4 characters. In production, paste keys into your server environment (or a secrets manager) and never into the mobile apps.</Banner>
      <div className="grid g4">
        <Kpi k="Start-here services live" v={`${ready} of ${start.length}`} d={ready === start.length ? "Ready to launch" : "Finish these before launch"} tone={ready === start.length ? "up" : "down"} />
        <Kpi k="Connected" v={L.filter((i) => i.status === "connected").length} d={`${L.length} listed`} />
        <Kpi k="Testing only" v={L.filter((i) => i.status === "sandbox").length} d="Sandbox, not real money or messages" />
        <Kpi k="Needs attention" v={L.filter((i) => i.status === "error").length} tone={L.some((i) => i.status === "error") ? "down" : "up"} d="Missing or wrong details" />
      </div>
      <section className="card"><Tabs<"all" | Integration["phase"]> tabs={[["all", "All", L.length], ["Start here", "Start here", L.filter((i) => i.phase === "Start here").length], ["Next", "Next", L.filter((i) => i.phase === "Next").length], ["Later", "Later", L.filter((i) => i.phase === "Later").length]]} value={tab} onChange={setTab} />
        <div className="grid g3 p-[18px]">{shown.map((i) => (
          <button key={i.id} className="icard" onClick={() => setOpen(i.id)}>
            <div className="row"><b>{i.name}</b><Pill tone={ST[i.status][1]}>{ST[i.status][0]}</Pill></div>
            <span className="soft">{i.why}</span>
            <div className="row muted"><span>{i.cat} · {i.phase}</span><span>{i.lastCheck ? `Checked ${ageTxt(i.lastCheck)} ago` : "Never checked"}</span></div>
            <div className="muted">{i.fields.filter((f) => f.set).length} of {i.fields.length} details added</div>
          </button>))}</div>
      </section>
      <Detail i={cur} onClose={close} />
    </>
  );
}

function Detail({ i, onClose }: { i: Integration | null; onClose: () => void }) {
  const { toast, confirm } = useOverlay(); const [vals, setVals] = useState<Record<string, string>>({}); const [env, setEnv] = useState<Integration["env"]>("sandbox"); const [seen, setSeen] = useState<string | null>(null);
  if (seen !== (i?.id ?? null)) { setSeen(i?.id ?? null); setVals({}); if (i) setEnv(i.env); }
  return (
    <Drawer open={!!i} onClose={onClose} title={i?.name ?? ""} sub={i && <><Pill tone={ST[i.status][1]}>{ST[i.status][0]}</Pill><span className="muted">{i.cat} · {i.phase}</span></>}
      footer={i && <><PermButton perm="tech" className="btn" onClick={() => { saveIntegration(i.id, vals, env); setVals({}); toast("Details saved"); }}>Save details</PermButton>
        <PermButton perm="tech" className="btn primary" onClick={() => { saveIntegration(i.id, vals, env); setVals({}); const r = testIntegration(i.id); toast(r === "connected" ? `${i.name} works` : "Some details are missing, so the check failed", r === "connected" ? "" : "bad"); }}>Save and test</PermButton></>}>
      {i && <>
        <div className="sect"><p className="m-0">{i.why}</p></div>
        <div className="sect"><h3>How to get these details</h3><ol className="steps">{i.steps.map((s, n) => <li key={n}>{s}</li>)}</ol>
          {i.link && <a className="btn sm" href={i.link} target="_blank" rel="noreferrer">Open {new URL(i.link).hostname} <Icon name="ext" small /></a>}</div>
        <div className="sect"><h3>Your details</h3>
          {i.env !== "n/a" && <div className="seg" role="group" aria-label="Environment"><button aria-pressed={env === "sandbox"} onClick={() => setEnv("sandbox")}>Sandbox (test)</button><button aria-pressed={env === "live"} onClick={() => setEnv("live")}>Live</button></div>}
          {i.fields.map((f) => (
            <Field key={f.key} id={`if-${f.key}`} label={f.label} hint={f.set ? `Saved${f.last4 ? `, ends in ${f.last4}` : ""}. Type to replace it.` : f.hint}>
              <input id={`if-${f.key}`} className="input" type={f.secret ? "password" : "text"} autoComplete="off" placeholder={f.set ? "••••••••" : ""} value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} /></Field>))}
          {i.note && <p className="soft m-0">{i.note}</p>}</div>
        {i.custom && <PermButton perm="tech" className="btn danger" onClick={() => confirm({ title: `Remove ${i.name}?`, text: "It is only removed from this list.", label: "Remove", danger: true, onOk: () => { removeIntegration(i.id); onClose(); toast("Removed"); } })}>Remove from list</PermButton>}
      </>}
    </Drawer>
  );
}

function AddDialog({ close }: { close: () => void }) {
  const { toast } = useOverlay(); const [name, setName] = useState(""); const [cat, setCat] = useState<Integration["cat"]>("Other"); const [why, setWhy] = useState(""); const [link, setLink] = useState(""); const [fields, setFields] = useState("API key, API secret");
  return (
    <DialogShell title="Add an integration" footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" disabled={!name.trim()} onClick={() => { addIntegration({ name: name.trim(), cat, why: why || "Added by your team.", link, fields }); close(); toast(`${name} added to Later`); }}>Add</button></>}>
      <Field id="an" label="Name"><input id="an" className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="For example Pesapal, Twilio, Slack" /></Field>
      <Field id="ac" label="Type"><select id="ac" className="input" value={cat} onChange={(e) => setCat(e.target.value as Integration["cat"])}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field id="aw" label="What it is for"><input id="aw" className="input" value={why} onChange={(e) => setWhy(e.target.value)} /></Field>
      <Field id="al" label="Sign-up or docs link" hint="Optional."><input id="al" className="input" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></Field>
      <Field id="af" label="Details you will need to store" hint="Separate with commas."><input id="af" className="input" value={fields} onChange={(e) => setFields(e.target.value)} /></Field>
    </DialogShell>
  );
}

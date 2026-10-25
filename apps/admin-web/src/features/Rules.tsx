"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useOverlay } from "@/components/Overlay";
import { PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { InviteDialog, RoleChangeDialog } from "./dialogs";
import { RULE_LABELS, removeMember, saveConfig } from "@/lib/actions";
import { PERMS, ROLES, ROLE_PERMS, calcFee } from "@/lib/constants";
import { money } from "@/lib/format";
import { can, useDb } from "@/lib/store";
import type { Config } from "@/lib/types";

const RULES: [string, [keyof Config, string, string][]][] = [
  ["Fees", [["findFee", "KSh", "Charged on every order for sourcing the item."], ["baseDelivery", "KSh", "First kilometre included."], ["perKm", "KSh", "Added for each kilometre after the first."], ["servicePct", "%", "Percent of item value."], ["serviceCap", "KSh", "The service charge never exceeds this."], ["riderShare", "%", "Paid out of the delivery part of the fee."]]],
  ["Dispatch", [["offerSecs", "sec", "How long a rider has to accept before the next one is asked."], ["radiusKm", "km", "Riders farther than this from the pickup are skipped."], ["maxJobs", "", "Orders one rider can carry at once."]]],
  ["Timers", [["quoteWindow", "sec", "How long suppliers have to send quotes before buyers see them."], ["payConfirmSla", "min", "Overview flags suppliers who take longer than this."]]],
];

export default function Rules() {
  const db = useDb()!; const { toast, dialog, confirm } = useOverlay(); const [tab, setTab] = useState<"rules" | "team">("rules");
  const [draft, setDraft] = useState<Config>({ ...db.config }); const keys = Object.keys(draft) as (keyof Config)[]; const changed = keys.filter((k) => draft[k] !== db.config[k]);
  const editable = can("config");
  const save = () => confirm({ title: `Save ${changed.length} change${changed.length > 1 ? "s" : ""}?`, text: changed.map((k) => `${RULE_LABELS[k]}: ${db.config[k]} to ${draft[k]}`).join(". ") + ". New orders use these values straight away.", label: "Save changes", onOk: () => { saveConfig(draft); toast("Rules saved"); } });
  return (
    <>
      <PageHead title="Rules and team" sub="The numbers that drive fees and dispatch, and who is allowed to change them." />
      <section className="card">
        <Tabs tabs={[["rules", "Fees and dispatch rules"], ["team", "Team and roles"]]} value={tab} onChange={setTab} />
        {tab === "rules" ? (
          <>
            <div className="grid g21 p-[18px]">
              <div className="grid gap-[22px]">{RULES.map(([g, items]) => (
                <div key={g}><h3 className="mb-2.5 mt-0 text-sm font-bold">{g}</h3>
                  <div className="grid g2 gap-3.5">{items.map(([k, u, h]) => (
                    <div key={k} className="field"><label htmlFor={`c-${k}`}>{RULE_LABELS[k]}</label>
                      <div className="flex items-center gap-2"><input id={`c-${k}`} type="number" min={0} step="any" className={`input num max-w-[130px] ${draft[k] !== db.config[k] ? "changed" : ""}`} value={draft[k]} disabled={!editable} onChange={(e) => { const v = parseFloat(e.target.value); setDraft({ ...draft, [k]: isNaN(v) ? 0 : v }); }} /><span className="muted">{u}</span></div>
                      <span className="hint">{h}</span></div>))}</div></div>))}</div>
              <div><div className="card flat"><header><div><h2>What buyers would pay</h2><p>GEKEL fee, before and after your edits</p></div></header>
                <div className="tw"><table className="t sm"><thead><tr><th>Order</th><th className="r">Now</th><th className="r">New</th></tr></thead>
                  <tbody>{([[2500, 1.5], [8000, 3], [24000, 4.5]] as [number, number][]).map(([v, km]) => { const a = calcFee(v, km, db.config), b = calcFee(v, km, draft); return (
                    <tr key={v}><td>{money(v)}, {km} km</td><td className="r num">{money(a)}</td><td className="r num"><b>{money(b)}</b> {a !== b && <Pill tone={b > a ? "warn" : "ok"} plain>{b > a ? "+" : "-"}{money(Math.abs(b - a))}</Pill>}</td></tr>); })}</tbody></table></div></div></div>
            </div>
            {changed.length > 0 && (
              <div className="savebar mx-[18px] mb-[18px]"><span><b>{changed.length} unsaved change{changed.length > 1 ? "s" : ""}</b> <span className="opacity-70">New orders use these values. Open orders keep theirs.</span></span>
                <span className="flex gap-2"><button className="btn sm ghost text-white" onClick={() => setDraft({ ...db.config })}>Discard</button><PermButton perm="config" className="btn sm primary" onClick={save}>Save changes</PermButton></span></div>
            )}
          </>
        ) : (
          <>
            <div className="toolbar"><span className="muted">{db.team.length} people. Everyone signs in with a code sent to their phone.</span><PermButton perm="team" className="btn sm primary ml-auto" onClick={() => dialog((close) => <InviteDialog close={close} />)}><Icon name="plus" small /> Invite team member</PermButton></div>
            <div className="tw"><table className="t"><thead><tr><th>Person</th><th>Role</th><th>Last active</th><th>2-step sign-in</th><th /></tr></thead>
              <tbody>{db.team.map((u) => (
                <tr key={u.id}><td><span className="two"><b>{u.name}</b><small>{u.email}</small></span></td><td><Pill tone={u.role === "Super admin" ? "dk" : ""} plain>{u.role}</Pill></td><td className="muted">{u.last}</td><td>{u.mfa ? <Pill tone="ok">On</Pill> : <Pill tone="warn">Off</Pill>}</td>
                  <td className="r"><PermButton perm="team" className="btn sm" onClick={() => dialog((close) => <RoleChangeDialog id={u.id} close={close} />)}>Change role</PermButton>{" "}{u.id !== "u1" && <PermButton perm="team" className="btn sm ghost" onClick={() => confirm({ title: `Remove ${u.name}?`, text: "They are signed out and lose access immediately.", label: "Remove", danger: true, onOk: () => { removeMember(u.id); toast(`${u.name} removed`); } })}>Remove</PermButton>}</td></tr>))}</tbody></table></div>
            <div className="sect"><h3>What each role can do</h3>
              <div className="tw"><table className="t"><thead><tr><th>Permission</th>{ROLES.map((r) => <th key={r} className="text-center">{r}</th>)}</tr></thead>
                <tbody>{PERMS.map(([k, l]) => <tr key={k}><td>{l}</td>{ROLES.map((r) => <td key={r} className="text-center">{ROLE_PERMS[r].includes(k) ? <span className="inline-flex text-ok" aria-label="Allowed"><Icon name="check" small /></span> : <span className="muted" aria-label="Not allowed">-</span>}</td>)}</tr>)}</tbody></table></div></div>
          </>
        )}
      </section>
    </>
  );
}

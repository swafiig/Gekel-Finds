"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { DialogShell, useOverlay } from "@/components/Overlay";
import { Field, Kpi, PageHead, PermButton, Pill, Tabs } from "@/components/ui";
import { useStaff, type Staff } from "@/lib/auth";
import { addStaff, changeStaffRole, deleteStaff, resetStaff, switchStaff } from "@/lib/actions2";
import { DEPTS, DEPT_ROLE, PERMS, ROLES, ROLE_PERMS } from "@/lib/constants";
import { ageTxt, initials } from "@/lib/format";
import { useDb } from "@/lib/store";
import type { Dept, RoleName } from "@/lib/types";

const copy = async (t: string, ok: () => void) => { try { await navigator.clipboard.writeText(t); ok(); } catch { ok(); } };

export default function StaffPage() {
  const db = useDb()!; const list = useStaff(); const { toast, dialog, confirm } = useOverlay(); const [tab, setTab] = useState<"people" | "roles">("people"); const [q, setQ] = useState("");
  const rows = list.filter((s) => !q || (s.name + s.email + s.dept + s.role).toLowerCase().includes(q.toLowerCase()));
  const pending = list.filter((s) => s.mustChange && s.status === "active").length;
  const err = (m: string | null) => { if (m) toast(m, "bad"); return !m; };
  return (
    <>
      <PageHead title="Staff" sub="Everyone who signs in to this console. There is no sign-up: you add a person, the console makes a password, and you give it to them.">
        <PermButton perm="team" className="btn primary" onClick={() => dialog((close) => <AddDialog close={close} />)}><Icon name="plus" small /> Add staff</PermButton>
      </PageHead>
      <div className="grid g4">
        <Kpi k="Active staff" v={list.filter((s) => s.status === "active").length} d={`${list.length} accounts in all`} />
        <Kpi k="Yet to set a password" v={pending} d={pending ? "Still using the one you gave them" : "Everyone chose their own"} tone={pending ? "down" : "up"} />
        <Kpi k="Super admins" v={list.filter((s) => s.role === "Super admin" && s.status === "active").length} d="Keep at least two you trust" />
        <Kpi k="Switched off" v={list.filter((s) => s.status === "disabled").length} d="Cannot sign in" />
      </div>
      <section className="card">
        <Tabs<"people" | "roles"> tabs={[["people", "People", list.length], ["roles", "What each role can do"]]} value={tab} onChange={setTab} />
        {tab === "people" ? (
          <>
            <div className="toolbar"><input className="input" placeholder="Search name, email, department" aria-label="Search staff" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="tw"><table className="t"><thead><tr><th>Person</th><th>Department</th><th>Role</th><th>Status</th><th>Last sign-in</th><th /></tr></thead>
              <tbody>{rows.map((s) => (
                <tr key={s.id}>
                  <td><span className="flex items-center gap-2.5"><span className="av">{initials(s.name)}</span><span className="two"><b>{s.name}{s.id === db.ui.user.id ? " (you)" : ""}</b><small>{s.email}</small></span></span></td>
                  <td>{s.dept}</td><td><Pill tone={s.role === "Super admin" ? "dk" : ""} plain>{s.role}</Pill></td>
                  <td>{s.status === "disabled" ? <Pill tone="bad">Switched off</Pill> : s.mustChange ? <Pill tone="warn">Password not changed yet</Pill> : <Pill tone="ok">Active</Pill>}</td>
                  <td className="muted">{s.lastSignIn ? `${ageTxt(s.lastSignIn)} ago` : "Never"}</td>
                  <td className="r"><span className="inline-flex flex-wrap justify-end gap-1.5">
                    <PermButton perm="team" className="btn sm" onClick={() => confirm({ title: `Make a new password for ${s.name}?`, text: "The old password stops working now. You will see the new one once. They must change it when they sign in.", label: "Make new password", onOk: async () => { const pw = await resetStaff(s.id); dialog((close) => <Handover s={s} pw={pw} close={close} reset />); } })}>New password</PermButton>
                    <PermButton perm="team" className="btn sm" onClick={() => dialog((close) => <RoleDialog s={s} close={close} />)}>Role</PermButton>
                    {s.id !== db.ui.user.id && <>
                      <PermButton perm="team" className="btn sm ghost" onClick={() => { if (err(switchStaff(s.id, s.status === "disabled"))) toast(s.status === "disabled" ? `${s.name} can sign in again` : `${s.name} is switched off`); }}>{s.status === "disabled" ? "Switch on" : "Switch off"}</PermButton>
                      <PermButton perm="team" className="btn sm ghost" aria-label={`Remove ${s.name}`} onClick={() => confirm({ title: `Remove ${s.name}?`, text: "The account is deleted. Their past actions stay in the audit log. Switch off instead if they might come back.", label: "Remove", danger: true, onOk: () => { if (err(deleteStaff(s.id))) toast(`${s.name} removed`); } })}><Icon name="trash" small /></PermButton></>}
                  </span></td>
                </tr>))}
                {!rows.length && <tr><td colSpan={6} className="muted">Nobody matches.</td></tr>}</tbody></table></div>
            <div className="sect"><h3>How it works</h3><ol className="steps soft"><li>Press Add staff and fill in their name, email, department and role.</li><li>The console makes a password like <b>Hk7m-Pq4t-Xw9n</b>. It is shown once. Copy the message and send it to them privately (WhatsApp or in person).</li><li>They sign in and are asked to choose their own password straight away.</li><li>Lost password? Press New password. Left the company? Switch off.</li></ol></div>
          </>
        ) : (
          <div className="tw"><table className="t"><thead><tr><th>Permission</th>{ROLES.map((r) => <th key={r} className="text-center">{r}</th>)}</tr></thead>
            <tbody>{PERMS.map(([k, l]) => <tr key={k}><td>{l}</td>{ROLES.map((r) => <td key={r} className="text-center">{ROLE_PERMS[r].includes(k) ? <span className="inline-flex text-ok" aria-label="Allowed"><Icon name="check" small /></span> : <span className="muted" aria-label="Not allowed">-</span>}</td>)}</tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}

function AddDialog({ close }: { close: () => void }) {
  const { dialog } = useOverlay(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [dept, setDept] = useState<Dept>("Operations"); const [role, setRole] = useState<RoleName>(DEPT_ROLE.Operations); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const valid = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email.trim());
  const go = async () => { setBusy(true); const r = await addStaff({ name, email, phone, dept, role }); setBusy(false); if ("error" in r) { setErr(r.error); return; } close(); dialog((c) => <Handover s={r.staff} pw={r.password} close={c} />); };
  return (
    <DialogShell title="Add staff" footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" disabled={!valid || busy} onClick={go}>Create account</button></>}>
      <Field id="sn" label="Full name"><input id="sn" className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="se" label="Work email" hint="This is what they type to sign in." error={err}><input id="se" className={`input ${err ? "err" : ""}`} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} /></Field>
      <Field id="sp" label="Phone"><input id="sp" className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <div className="grid g2">
        <Field id="sd" label="Department"><select id="sd" className="input" value={dept} onChange={(e) => { const d = e.target.value as Dept; setDept(d); setRole(DEPT_ROLE[d]); }}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field id="sr" label="Role" hint="Decides what they can change."><select id="sr" className="input" value={role} onChange={(e) => setRole(e.target.value as RoleName)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
      </div>
      <p className="soft m-0">{role} can: {ROLE_PERMS[role].map((p) => PERMS.find((x) => x[0] === p)![1].toLowerCase()).join("; ")}.</p>
    </DialogShell>
  );
}

function Handover({ s, pw, close, reset }: { s: Staff; pw: string; close: () => void; reset?: boolean }) {
  const { toast } = useOverlay(); const url = typeof location !== "undefined" ? location.origin + "/login" : "/login";
  const msg = `Hi ${s.name.split(" ")[0]}, ${reset ? "here is your new GEKEL console password" : "your GEKEL console account is ready"}.\nSign in: ${url}\nEmail: ${s.email}\nPassword: ${pw}\nYou will be asked to choose your own password straight away.`;
  return (
    <DialogShell title={reset ? "New password ready" : "Account created"} footer={<><button className="btn" onClick={() => copy(msg, () => toast("Message copied"))}><Icon name="copy" small /> Copy whole message</button><button className="btn primary" onClick={close}>Done, I have given it</button></>}>
      <p className="m-0"><b>{s.name}</b> ({s.role}, {s.dept}). Give them this password privately.</p>
      <div className="pwbox"><code>{pw}</code><button className="btn sm" onClick={() => copy(pw, () => toast("Password copied"))}><Icon name="copy" small /> Copy</button></div>
      <p className="soft m-0"><b>This is the only time it is shown.</b> The console keeps a scrambled version and cannot show it again. If it is lost, make a new one. They must change it when they first sign in.</p>
    </DialogShell>
  );
}

function RoleDialog({ s, close }: { s: Staff; close: () => void }) {
  const { toast } = useOverlay(); const [role, setRole] = useState<RoleName>(s.role); const [dept, setDept] = useState<Dept>(s.dept);
  return (
    <DialogShell title={`Change role: ${s.name}`} footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { const m = changeStaffRole(s.id, role, dept); if (m) { toast(m, "bad"); return; } close(); toast("Role updated"); }}>Save</button></>}>
      <div className="grid g2"><Field id="rd" label="Department"><select id="rd" className="input" value={dept} onChange={(e) => setDept(e.target.value as Dept)}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field id="rr" label="Role"><select id="rr" className="input" value={role} onChange={(e) => setRole(e.target.value as RoleName)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field></div>
      <p className="soft m-0">{role} can: {ROLE_PERMS[role].map((p) => PERMS.find((x) => x[0] === p)![1].toLowerCase()).join("; ")}.</p>
    </DialogShell>
  );
}

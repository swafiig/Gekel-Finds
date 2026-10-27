"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { bootAuth, changeOwnPassword, getSession, passwordProblem, signIn, signOut } from "@/lib/auth";

/* Sign-in only. There is no sign-up: a Super admin creates every account under Staff and hands over the password. */
function LoginForm() {
  const router = useRouter(); const sp = useSearchParams(); const forced = sp.get("change") === "1";
  const [step, setStep] = useState<"in" | "change">(forced ? "change" : "in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [show, setShow] = useState(false);
  const [n1, setN1] = useState(""); const [n2, setN2] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => { try { const t = localStorage.getItem("gk.theme"); if (t) document.documentElement.dataset.theme = t; } catch {} }, []);
  useEffect(() => { bootAuth().then(() => { const s = getSession(); if (!s) { if (forced) setStep("in"); return; } if (s.mustChange) { setUid(s.id); setStep("change"); } else router.replace("/"); }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await signIn(email, pw); setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    if (r.mustChange) { setUid(r.staff.id); setStep("change"); return; }
    router.replace("/");
  };
  const change = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!uid) { setStep("in"); return; }
    if (n1 !== n2) { setErr("The two new passwords do not match."); return; }
    setBusy(true); const m = await changeOwnPassword(uid, pw, n1); setBusy(false);
    if (m) { setErr(m); return; } router.replace("/");
  };
  return (
    <main className="login">
      <aside className="lside">
        <div className="brand"><Image src="/mark-white.png" alt="" width={44} height={44} /><div><b>GEKEL</b><span>Ops console</span></div></div>
        <div className="lpitch"><h1>You ask.<br />We find.<br />We pack.<br /><em>We deliver.</em></h1><p>Staff only. Accounts are created for you by a GEKEL admin.</p></div>
        <small>Eastleigh and Kamukunji, Nairobi</small>
      </aside>
      <section className="lmain">
        {step === "in" ? (
          <form className="lform" onSubmit={submit} noValidate>
            <h2>Sign in</h2><p className="soft">Use the email and password your admin gave you.</p>
            <div className="field"><label htmlFor="em">Work email</label><input id="em" className={`input ${err ? "err" : ""}`} type="email" autoComplete="username" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@gekel.co" /></div>
            <div className="field"><label htmlFor="pw">Password</label>
              <div className="pwrow"><input id="pw" className={`input ${err ? "err" : ""}`} type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} /><button type="button" className="iconbtn" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}><Icon name={show ? "eyeoff" : "eye"} /></button></div>
              {err && <span className="errtxt" role="alert">{err}</span>}</div>
            <button className="btn primary lg" disabled={busy || !email || !pw}>{busy ? "Checking..." : "Sign in"}</button>
            <p className="hint">No account? Ask a Super admin to add you under Staff. There is no sign-up here.</p>
            <p className="hint demo">Demo accounts: rashid@gekel.co (Super admin), karanja@gekel.co (Ops lead), wanjiru@gekel.co (Sourcing), achieng@gekel.co (Support), farah@gekel.co (Finance), otieno@gekel.co (Tech). Password <b>Gekel#2026</b>.</p>
          </form>
        ) : (
          <form className="lform" onSubmit={change} noValidate>
            <h2>Choose your own password</h2><p className="soft">The password you were given works once. Set one only you know. At least 10 characters with letters and a number.</p>
            {!uid || !pw ? <div className="field"><label htmlFor="cur">Password you were given</label><input id="cur" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div> : null}
            <div className="field"><label htmlFor="n1">New password</label><input id="n1" className="input" type={show ? "text" : "password"} autoComplete="new-password" autoFocus value={n1} onChange={(e) => { setN1(e.target.value); setErr(""); }} />{n1 && passwordProblem(n1) && <span className="errtxt">{passwordProblem(n1)}</span>}</div>
            <div className="field"><label htmlFor="n2">New password again</label><input id="n2" className="input" type={show ? "text" : "password"} autoComplete="new-password" value={n2} onChange={(e) => { setN2(e.target.value); setErr(""); }} />{err && <span className="errtxt" role="alert">{err}</span>}</div>
            <label className="chk"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
            <button className="btn primary lg" disabled={busy || !n1 || !n2 || !pw}>{busy ? "Saving..." : "Save and continue"}</button>
            <button type="button" className="btn ghost" onClick={() => { signOut(); setStep("in"); setPw(""); setN1(""); setN2(""); router.replace("/login"); }}>Cancel and sign out</button>
          </form>
        )}
      </section>
    </main>
  );
}
export default function Page() { return <Suspense fallback={null}><LoginForm /></Suspense>; }

"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { DialogShell, OverlayProvider, useLayer, useOverlay } from "./Overlay";
import { setHub, setLive, setRole } from "@/lib/actions";
import { PERMS, ROLES, ROLE_PERMS, ME, STATUS } from "@/lib/constants";
import { initDb, getAlerts, inHub, sup, tickEngine, useDb } from "@/lib/store";
import { initials } from "@/lib/format";
import type { HubFilter, RoleName } from "@/lib/types";

const NAV: [string, [string, string, string][]][] = [
  ["Operations", [["/", "Overview", "home"], ["/orders", "Orders", "orders"], ["/requests", "Requests", "request"]]],
  ["People", [["/suppliers", "Suppliers", "store"], ["/riders", "Riders and dispatch", "bike"]]],
  ["Trust and money", [["/disputes", "Disputes", "shield"], ["/payments", "Payments", "wallet"]]],
  ["Admin", [["/rules", "Rules and team", "sliders"], ["/audit", "Audit log", "list"]]],
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  return (<OverlayProvider><Frame>{children}</Frame></OverlayProvider>);
}

function Frame({ children }: { children: ReactNode }) {
  const db = useDb();
  const [menu, setMenu] = useState(false);
  const [pal, setPal] = useState(false);
  const pathname = usePathname();

  useEffect(() => { initDb(); }, []);
  useEffect(() => { try { const t = localStorage.getItem("gk.theme"); if (t) document.documentElement.dataset.theme = t; } catch {} }, []);
  useEffect(() => { setMenu(false); }, [pathname]);
  const live = db?.ui.live ?? false;
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => { if (!document.hidden) tickEngine(); }, 3000);
    return () => clearInterval(id);
  }, [live]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal(true); } };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!db) return <div className="grid h-full place-items-center text-ink-3">Loading console...</div>;
  return (
    <div className="app">
      <Sidebar open={menu} />
      <div className="stage">
        <Topbar onMenu={() => setMenu((m) => !m)} onSearch={() => setPal(true)} />
        <main className="main" id="main" tabIndex={-1}><div className="wrap"><Suspense fallback={null}>{children}</Suspense></div></main>
      </div>
      <Palette open={pal} onClose={() => setPal(false)} />
    </div>
  );
}

function Sidebar({ open }: { open: boolean }) {
  const db = useDb()!; const path = usePathname(); const [ms, setMs] = useState(150);
  useEffect(() => { const id = setInterval(() => setMs(120 + Math.round(Math.random() * 70)), 6000); return () => clearInterval(id); }, []);
  const need = db.orders.filter((o) => o.status === "ready" && !o.rider && inHub(o)).length;
  const b: Record<string, number> = {
    "/orders": db.orders.filter((o) => !["delivered", "cancelled"].includes(o.status) && inHub(o)).length,
    "/requests": db.requests.filter((q) => q.status === "open" && inHub(q)).length,
    "/suppliers": db.suppliers.filter((s) => s.status === "pending" && inHub(s)).length,
    "/riders": need, "/disputes": db.disputes.filter((d) => d.status !== "resolved").length, "/payments": db.unmatched.length,
  };
  const hot: Record<string, boolean> = { "/riders": need > 0, "/disputes": db.disputes.some((d) => d.status !== "resolved" && d.sla < Date.now() + 20 * 60000) };
  return (
    <aside className={`side ${open ? "on" : ""}`} aria-label="Sidebar">
      <div className="brand"><Image src="/mark-white.png" alt="" width={34} height={34} /><div><b>GEKEL</b><span>Ops console</span></div></div>
      <nav className="nav" aria-label="Main">
        {NAV.map(([g, items]) => (
          <div key={g} className="contents">
            <h6>{g}</h6>
            {items.map(([href, label, icon]) => (
              <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
                <Icon name={icon} /><span>{label}</span>{b[href] ? <span className={`badge ${hot[href] ? "hot" : ""}`}>{b[href]}</span> : null}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <div className="sys" aria-label="System status">
          <div><span><i className="dot" />Daraja</span><b>{ms} ms</b></div>
          <div><span><i className="dot" />SMS gateway</span><b>Healthy</b></div>
          <div><span><i className={`dot ${db.ui.live ? "live" : "warn"}`} />Live feed</span><b>{db.ui.live ? "On" : "Paused"}</b></div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const db = useDb()!; const router = useRouter(); const { toast, dialog } = useOverlay();
  const alerts = getAlerts().filter((a) => a.sev >= 2).length;
  const [dark, setDark] = useState(false);
  useEffect(() => { const t = document.documentElement.dataset.theme; setDark(t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches)); }, []);
  const toggleTheme = () => { const next = dark ? "light" : "dark"; document.documentElement.dataset.theme = next; try { localStorage.setItem("gk.theme", next); } catch {} setDark(!dark); };
  const roleDialog = () => dialog((close) => <RoleDialog close={close} onDone={(r) => toast(r === ME.role ? "Back to your own role" : `Viewing as ${r}`)} />);
  return (
    <header className="top">
      <button className="iconbtn menu" onClick={onMenu} aria-label="Open menu"><Icon name="menu" /></button>
      <button className="cmdk" onClick={onSearch} aria-label="Search everything"><Icon name="search" /><span>Search orders, suppliers, riders</span><kbd>Ctrl K</kbd></button>
      <div className="seg hubseg" role="group" aria-label="Hub filter">
        {(["All", "Eastleigh", "Kamukunji"] as HubFilter[]).map((h) => <button key={h} aria-pressed={db.ui.hub === h} onClick={() => setHub(h)}>{h === "All" ? "All hubs" : h}</button>)}
      </div>
      <div className="sp" />
      <button className="iconbtn" onClick={() => { setLive(!db.ui.live); toast(db.ui.live ? "Live updates paused" : "Live updates resumed"); }} aria-label={db.ui.live ? "Pause live updates" : "Resume live updates"} title={db.ui.live ? "Pause live updates" : "Resume live updates"}><Icon name={db.ui.live ? "pause" : "play"} /></button>
      <button className="iconbtn" onClick={() => router.push("/#alerts")} aria-label={`Needs attention: ${alerts}`}><Icon name="bell" />{alerts ? <i className="pip" /> : null}</button>
      <button className="iconbtn" onClick={toggleTheme} aria-label="Switch theme"><Icon name={dark ? "sun" : "moon"} /></button>
      <button className="who" onClick={roleDialog} aria-label={`Signed in as ${ME.name}, ${db.ui.role}. Change role view`}><span className="av">{initials(ME.name)}</span><span><b>{ME.name}</b><small>{db.ui.role}</small></span></button>
    </header>
  );
}

function RoleDialog({ close, onDone }: { close: () => void; onDone: (r: RoleName) => void }) {
  const db = useDb()!; const [r, setR] = useState<RoleName>(db.ui.role);
  return (
    <DialogShell title="View as another role" footer={<><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={() => { setRole(r); close(); onDone(r); }}>Switch view</button></>}>
      <p className="soft m-0">Try the console with a smaller set of permissions. Your real role does not change.</p>
      <div className="grid gap-2">
        {ROLES.map((x) => (
          <label key={x} className="card flat flex cursor-pointer items-center gap-3 px-3 py-2.5">
            <input type="radio" name="role" checked={r === x} onChange={() => setR(x)} className="accent-accent" />
            <span className="flex-1"><b>{x}</b><div className="muted">{ROLE_PERMS[x].map((p) => PERMS.find((y) => y[0] === p)![1]).join(", ")}</div></span>
          </label>
        ))}
      </div>
    </DialogShell>
  );
}

/* ---------- command palette ---------- */
interface Item { g: string; t: string; s: string; k?: string; href: string }
function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDb()!; const router = useRouter(); const [q, setQ] = useState(""); const [idx, setIdx] = useState(0); const inp = useRef<HTMLInputElement>(null);
  useLayer(open, onClose);
  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inp.current?.focus(), 30); } }, [open]);
  const items = useMemo<Item[]>(() => {
    if (!open) return [];
    const all: Item[] = [];
    NAV.forEach(([, it]) => it.forEach(([href, l]) => all.push({ g: "Go to", t: l, s: "", href })));
    db.orders.forEach((o) => all.push({ g: "Orders", t: `${o.code} ${o.buyer}`, s: `${sup(o.sid).name} · ${STATUS[o.status].label}`, k: `${o.code} ${o.buyer} ${sup(o.sid).name} ${o.mpesa ?? ""} ${o.area}`, href: `/orders?open=${o.id}` }));
    db.suppliers.forEach((s) => all.push({ g: "Suppliers", t: s.name, s: `${s.hub} · ${s.status}`, k: `${s.name} ${s.owner} ${s.till} ${s.stall}`, href: `/suppliers?id=${s.id}` }));
    db.riders.forEach((r) => all.push({ g: "Riders", t: r.name, s: `${r.plate} · ${r.status}`, k: `${r.name} ${r.plate} ${r.phone}`, href: `/riders?open=${r.id}` }));
    db.disputes.forEach((d) => all.push({ g: "Disputes", t: `${d.id} ${d.kind}`, s: d.status, k: `${d.id} ${d.kind} ${d.claim}`, href: `/disputes?id=${d.id}` }));
    db.requests.forEach((r) => all.push({ g: "Requests", t: `${r.code} ${r.title}`, s: r.buyer, k: `${r.code} ${r.title} ${r.buyer}`, href: "/requests" }));
    const s = q.toLowerCase().trim();
    return (s ? all.filter((i) => `${i.t} ${i.k ?? ""} ${i.s}`.toLowerCase().includes(s)) : all.filter((i) => i.g === "Go to")).slice(0, 40);
  }, [open, q, db, db.orders.length]);
  const run = useCallback((i: Item | undefined) => { if (!i) return; onClose(); router.push(i.href); }, [onClose, router]);
  let last = "";
  return (
    <div className={`modal palette ${open ? "on" : ""}`} role="dialog" aria-modal="true" aria-label="Search">
      {open && (<>
        <input ref={inp} value={q} placeholder="Search by order code, M-Pesa code, name, plate, Till…" autoComplete="off" aria-label="Search"
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
            else if (e.key === "Enter") { e.preventDefault(); run(items[idx]); }
          }} />
        <ul role="listbox">
          {items.length ? items.map((i, n) => {
            const head = i.g !== last ? <li className="grp" role="presentation">{i.g}</li> : null; last = i.g;
            return (<div key={n} className="contents">{head}<li role="option" aria-selected={n === idx}><button aria-selected={n === idx} onClick={() => run(i)}><span>{i.t}</span><small>{i.s}</small></button></li></div>);
          }) : <li className="empty"><b>No matches</b>Try an order code like GK-10482 or a supplier name.</li>}
        </ul>
      </>)}
    </div>
  );
}

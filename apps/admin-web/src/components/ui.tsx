"use client";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./icons";
import { useOverlay } from "./Overlay";
import { STATUS } from "@/lib/constants";
import { can, getDb, permName } from "@/lib/store";
import type { Order, PermKey, Tone } from "@/lib/types";

export const Pill = ({ tone = "", plain, children }: { tone?: Tone; plain?: boolean; children: ReactNode }) => <span className={`pill ${tone} ${plain ? "nodot" : ""}`}>{children}</span>;
export const StatusPill = ({ o }: { o: Order }) => <Pill tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Pill>;

/** A button that explains itself when the signed-in role lacks the permission. */
export function PermButton({ perm, onClick, className = "btn", children, ...rest }: { perm: PermKey } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toast } = useOverlay(); const ok = getDb() ? can(perm) : true;
  return (
    <button {...rest} className={className} aria-disabled={!ok} title={ok ? rest.title : `Needs ${permName(perm).toLowerCase()} access`}
      onClick={(e) => { if (!ok) { toast(`${getDb().ui.role} can't do this. Ask someone with ${permName(perm).toLowerCase()} access.`, "bad"); return; } onClick?.(e); }}>
      {children}
    </button>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (<div className="phead"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="acts">{children}</div></div>);
}
export const Empty = ({ title, children }: { title: string; children?: ReactNode }) => <div className="empty"><b>{title}</b>{children}</div>;
export const Banner = ({ icon = "alert", warn, children }: { icon?: string; warn?: boolean; children: ReactNode }) => <div className={`banner ${warn ? "warn" : ""}`}><Icon name={icon} small /><span>{children}</span></div>;
export const Bar = ({ pct, tone = "" }: { pct: number; tone?: "" | "ok" | "bad" | "acc" }) => <div className={`bar ${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>;
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string, number?][]; value: T; onChange: (v: T) => void }) {
  return (<div className="tabs px-[18px]" role="tablist">{tabs.map(([k, l, n]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}>{l}{n !== undefined && <span className="n">{n}</span>}</button>)}</div>);
}
export function Chips<T extends string>({ items, value, onChange }: { items: [T, string, number][]; value: T; onChange: (v: T) => void }) {
  return (<div className="chips" role="group">{items.map(([k, l, n]) => <button key={k} className="chip" aria-pressed={value === k} onClick={() => onChange(k)}>{l} <span className="n">{n}</span></button>)}</div>);
}
export const NavLink = Link;

export function Kpi({ k, v, d, tone }: { k: string; v: ReactNode; d?: ReactNode; tone?: "up" | "down" | "flat" }) {
  return (<div className="card kpi"><span className="k">{k}</span><span className="v num">{v}</span>{d && <span className={`d ${tone ?? "flat"}`}>{d}</span>}</div>);
}
export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (<button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className="toggle" onClick={() => onChange(!on)}><i /></button>);
}
/** A simple vertical stage tracker. `at` is the current stage index. */
export function Stages({ stages, at, closed }: { stages: readonly string[]; at: number; closed?: boolean }) {
  const fin = at >= stages.length - 1 && !closed;
  return (<div className="tl">{stages.map((s, i) => { const done = i < at || (fin && i === at); return (
    <div key={s} className={`s ${done ? "done" : i === at && !closed ? "cur" : "todo"}`}><span className="m">{done ? <Icon name="check" small /> : null}</span><div><b>{s}</b></div></div>); })}</div>);
}
export const Field = ({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) => (
  <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && !error && <span className="hint">{hint}</span>}{error && <span className="errtxt">{error}</span>}</div>
);

export interface Col<T> { key: keyof T & string; label: string; type: "text" | "number" | "toggle" | "select" | "date"; options?: string[]; unit?: string; width?: number; hint?: string }
/** An editable table. Edits go to the draft held by the page; nothing is saved until the page's save bar is used. */
export function EditTable<T extends { id: string }>({ rows, cols, onChange, make, addLabel, disabled, emptyText }: { rows: T[]; cols: Col<T>[]; onChange: (r: T[]) => void; make?: () => T; addLabel?: string; disabled?: boolean; emptyText?: string }) {
  const set = (i: number, k: string, v: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <div className="tw"><table className="t et"><thead><tr>{cols.map((c) => <th key={c.key} className={c.type === "number" ? "r" : ""} title={c.hint}>{c.label}{c.unit ? ` (${c.unit})` : ""}</th>)}<th /></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id}>{cols.map((c) => { const v = r[c.key] as unknown; return (
            <td key={c.key} className={c.type === "number" ? "r" : ""}>
              {c.type === "toggle" ? <Toggle on={!!v} onChange={(x) => set(i, c.key, x)} label={`${c.label}, row ${i + 1}`} disabled={disabled} />
                : c.type === "select" ? <select className="input" aria-label={c.label} disabled={disabled} value={String(v)} onChange={(e) => set(i, c.key, e.target.value)}>{c.options!.map((o) => <option key={o}>{o}</option>)}</select>
                : c.type === "number" ? <input className="input num" type="number" min={0} step="any" aria-label={c.label} disabled={disabled} style={{ width: c.width ?? 100, textAlign: "right" }} value={Number(v)} onChange={(e) => set(i, c.key, parseFloat(e.target.value) || 0)} />
                : <input className="input" type="text" aria-label={c.label} disabled={disabled} style={{ minWidth: c.width ?? 120 }} value={String(v ?? "")} onChange={(e) => set(i, c.key, e.target.value)} />}
            </td>); })}
            <td className="r">{!disabled && <button className="btn sm ghost" aria-label={`Remove row ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}><Icon name="trash" small /></button>}</td></tr>))}
          {!rows.length && <tr><td colSpan={cols.length + 1} className="muted">{emptyText ?? "Nothing here yet."}</td></tr>}
        </tbody></table></div>
      {make && !disabled && <div className="px-3.5 py-3"><button className="btn sm" onClick={() => onChange([...rows, make()])}><Icon name="plus" small /> {addLabel ?? "Add row"}</button></div>}
    </div>
  );
}

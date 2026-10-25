"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

type Tone = "" | "bad";
interface ConfirmOpts {
  title: string; text: ReactNode; label: string; danger?: boolean; onOk: (value: string) => void;
  field?: { label: string; options?: string[]; placeholder?: string; required?: boolean; error?: string };
}
interface Ctx {
  toast: (msg: string, tone?: Tone) => void;
  dialog: (render: (close: () => void) => ReactNode) => void;
  closeDialog: () => void;
  confirm: (o: ConfirmOpts) => void;
  registerLayer: (close: () => void) => () => void;
}
const OverlayCtx = createContext<Ctx | null>(null);
export const useOverlay = () => { const c = useContext(OverlayCtx); if (!c) throw new Error("useOverlay needs <OverlayProvider>"); return c; };

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: Tone }[]>([]);
  const [dlg, setDlg] = useState<((close: () => void) => ReactNode) | null>(null);
  const layers = useRef<(() => void)[]>([]);
  const [count, setCount] = useState(0);
  const seq = useRef(0);

  const toast = useCallback((msg: string, tone: Tone = "") => {
    const id = ++seq.current; setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const closeDialog = useCallback(() => setDlg(null), []);
  const dialog = useCallback((render: (close: () => void) => ReactNode) => setDlg(() => render), []);
  const registerLayer = useCallback((close: () => void) => {
    layers.current.push(close); setCount(layers.current.length);
    return () => { layers.current = layers.current.filter((f) => f !== close); setCount(layers.current.length); };
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => dialog((close) => <ConfirmBody {...o} close={close} />), [dialog]);

  useEffect(() => {
    if (!dlg) return; return registerLayer(() => setDlg(null));
  }, [dlg, registerLayer]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && layers.current.length) { layers.current[layers.current.length - 1](); } };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <OverlayCtx.Provider value={{ toast, dialog, closeDialog, confirm, registerLayer }}>
      {children}
      <div className={`scrim ${count ? "on" : ""}`} onClick={() => layers.current[layers.current.length - 1]?.()} />
      <div className={`modal ${dlg ? "on" : ""}`} role="dialog" aria-modal="true">{dlg ? dlg(closeDialog) : null}</div>
      <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.tone}`} role="status"><span>{t.msg}</span></div>)}</div>
    </OverlayCtx.Provider>
  );
}

/** Registers an overlay (drawer, palette) so Esc and the scrim close it. */
export function useLayer(open: boolean, onClose: () => void) {
  const { registerLayer } = useOverlay(); const ref = useRef(onClose); ref.current = onClose;
  useEffect(() => { if (!open) return; return registerLayer(() => ref.current()); }, [open, registerLayer]);
}

export function DialogShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (<><div className="mh"><h2>{title}</h2></div><div className="mb">{children}</div><div className="mf">{footer}</div></>);
}

function ConfirmBody({ title, text, label, danger, onOk, field, close }: ConfirmOpts & { close: () => void }) {
  const [v, setV] = useState(field?.options?.[0] ?? ""); const [err, setErr] = useState(false); const id = useId();
  const submit = () => { if (field && field.required !== false && !v.trim()) { setErr(true); return; } close(); onOk(v.trim()); };
  return (
    <DialogShell title={title} footer={<><button className="btn" onClick={close}>Cancel</button><button className={`btn ${danger ? "danger" : "primary"}`} onClick={submit}>{label}</button></>}>
      <p className="soft m-0">{text}</p>
      {field && (
        <div className="field">
          <label htmlFor={id}>{field.label}</label>
          {field.options ? (
            <select id={id} className="input" value={v} onChange={(e) => setV(e.target.value)}>{field.options.map((o) => <option key={o}>{o}</option>)}</select>
          ) : (
            <textarea id={id} autoFocus className={`input ${err ? "err" : ""}`} placeholder={field.placeholder} value={v} onChange={(e) => { setV(e.target.value); setErr(false); }} />
          )}
          {err && <span className="errtxt">{field.error ?? "This is required."}</span>}
        </div>
      )}
    </DialogShell>
  );
}

export function Drawer({ open, onClose, title, sub, footer, children }: { open: boolean; onClose: () => void; title: string; sub?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  useLayer(open, onClose);
  return (
    <aside className={`drawer ${open ? "on" : ""}`} aria-hidden={!open} aria-label="Details">
      {open && (<>
        <header>
          <div className="min-w-0"><h2>{title}</h2><div className="mt-1.5 flex flex-wrap items-center gap-2">{sub}</div></div>
          <button className="iconbtn" onClick={onClose} aria-label="Close panel"><Icon name="x" /></button>
        </header>
        <div className="dbody">{children}</div>
        {footer && <footer>{footer}</footer>}
      </>)}
    </aside>
  );
}

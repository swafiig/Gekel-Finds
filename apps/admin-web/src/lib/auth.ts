"use client";
import { useSyncExternalStore } from "react";
import type { Dept, RoleName } from "./types";

/*
  Staff accounts and sign-in, kept in this browser for the demo.
  - Passwords are never stored. Only a salted PBKDF2 hash is.
  - There is no sign-up. Accounts are created by a Super admin under Staff, who hands over the generated password.
  - Every new or reset password must be changed at the first sign-in.
  Replace the functions below with calls to your API when the backend exists; the screens do not change.
*/
export interface Staff {
  id: string; name: string; email: string; phone: string; dept: Dept; role: RoleName; status: "active" | "disabled";
  mustChange: boolean; salt: string; hash: string; lastSignIn: number | null; createdAt: number; createdBy: string;
}
export const DEMO_PASSWORD = "Gekel#2026";
export const MIN_PW = 10;

const KEY = "gk.staff.v1", SES = "gk.session.v1";
let staff: Staff[] = []; let ready = false; let version = 0; const subs = new Set<() => void>();
const emitAuth = () => { version++; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(staff)); } catch {} emitAuth(); };

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))));
const randBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
export async function hashPw(pw: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: Uint8Array.from(atob(salt), (c) => c.charCodeAt(0)), iterations: 120000 }, key, 256);
  return b64(bits);
}

/** 12 characters in three groups, no look-alikes (0/O, 1/l/I), easy to read out over a phone call. */
export function genPassword(): string {
  const set = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; const lim = 256 - (256 % set.length); const out: string[] = [];
  while (out.length < 12) randBytes(24).forEach((b) => { if (out.length < 12 && b < lim) out.push(set[b % set.length]); });
  return [out.slice(0, 4), out.slice(4, 8), out.slice(8, 12)].map((g) => g.join("")).join("-");
}
export const passwordProblem = (pw: string): string | null => pw.length < MIN_PW ? `Use at least ${MIN_PW} characters.` : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "Use letters and at least one number." : null;

const uid = () => "u" + Math.random().toString(36).slice(2, 8);
async function mk(name: string, email: string, phone: string, dept: Dept, role: RoleName, pw: string, mustChange: boolean, by: string, last: number | null = null): Promise<Staff> {
  const salt = b64(randBytes(16)); return { id: uid(), name, email: email.toLowerCase(), phone, dept, role, status: "active", mustChange, salt, hash: await hashPw(pw, salt), lastSignIn: last, createdAt: Date.now(), createdBy: by };
}

let booting: Promise<void> | null = null;
export function bootAuth(): Promise<void> {
  if (ready) return Promise.resolve();
  return (booting ??= (async () => {
    try { const raw = localStorage.getItem(KEY); if (raw) staff = JSON.parse(raw); } catch {}
    if (!staff.length) {
      const H = 3600000, N = Date.now();
      staff = await Promise.all([
        mk("Rashid Mwangi", "rashid@gekel.co", "0712 000 001", "Management", "Super admin", DEMO_PASSWORD, false, "System", N),
        mk("Karanja Maina", "karanja@gekel.co", "0712 000 002", "Operations", "Ops lead", DEMO_PASSWORD, false, "Rashid Mwangi", N - 12 * 60000),
        mk("Wanjiru Kamau", "wanjiru@gekel.co", "0712 000 003", "Sourcing", "Sourcing agent", DEMO_PASSWORD, false, "Rashid Mwangi", N - 2 * H),
        mk("Achieng Odera", "achieng@gekel.co", "0712 000 004", "Support", "Support", DEMO_PASSWORD, false, "Rashid Mwangi", N - 5 * 60000),
        mk("Farah Hussein", "farah@gekel.co", "0712 000 005", "Finance", "Finance", DEMO_PASSWORD, false, "Rashid Mwangi", N - 24 * H),
        mk("Otieno Ouma", "otieno@gekel.co", "0712 000 006", "Tech", "Tech", DEMO_PASSWORD, false, "Rashid Mwangi", N - 30 * H),
      ]);
      try { localStorage.setItem(KEY, JSON.stringify(staff)); } catch {}
    }
    ready = true; emitAuth();
  })());
}
export const useStaff = (): Staff[] => { useSyncExternalStore(subscribe, () => version, () => 0); return staff; };
export const staffList = () => staff;
export const staffById = (id: string) => staff.find((s) => s.id === id);

/* ---------- session ---------- */
export const getSession = (): Staff | null => { try { const id = sessionStorage.getItem(SES); return (id && staff.find((s) => s.id === id && s.status === "active")) || null; } catch { return null; } };
export const signOut = () => { try { sessionStorage.removeItem(SES); } catch {} emitAuth(); };

const fails = new Map<string, { n: number; until: number }>();
export type SignInResult = { ok: true; staff: Staff; mustChange: boolean } | { ok: false; error: string };
export async function signIn(email: string, password: string): Promise<SignInResult> {
  await bootAuth(); const e = email.trim().toLowerCase(); const f = fails.get(e) ?? { n: 0, until: 0 };
  if (f.until > Date.now()) return { ok: false, error: `Too many tries. Wait ${Math.ceil((f.until - Date.now()) / 1000)} seconds and try again.` };
  const s = staff.find((x) => x.email === e); const good = s ? (await hashPw(password, s.salt)) === s.hash : (await hashPw(password, b64(new Uint8Array(16))), false);
  if (!s || !good) { f.n++; if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; } fails.set(e, f); return { ok: false, error: "Email or password is not right." }; }
  if (s.status === "disabled") return { ok: false, error: "This account is switched off. Ask a Super admin." };
  fails.delete(e); s.lastSignIn = Date.now(); try { sessionStorage.setItem(SES, s.id); } catch {} save();
  return { ok: true, staff: s, mustChange: s.mustChange };
}
export async function changeOwnPassword(id: string, current: string, next: string): Promise<string | null> {
  const s = staffById(id); if (!s) return "Account not found.";
  if ((await hashPw(current, s.salt)) !== s.hash) return "Your current password is not right.";
  const p = passwordProblem(next); if (p) return p; if (next === current) return "Choose a different password from the one you were given.";
  s.salt = b64(randBytes(16)); s.hash = await hashPw(next, s.salt); s.mustChange = false; save(); return null;
}

/* ---------- admin actions (a Super admin hands the password over; it is shown once) ---------- */
export async function createStaff(i: { name: string; email: string; phone: string; dept: Dept; role: RoleName }, by: string): Promise<{ staff: Staff; password: string } | { error: string }> {
  await bootAuth(); const email = i.email.trim().toLowerCase();
  if (staff.some((s) => s.email === email)) return { error: "Someone with this email already has an account." };
  const password = genPassword(); const s = await mk(i.name.trim(), email, i.phone.trim(), i.dept, i.role, password, true, by); staff = [...staff, s]; save(); return { staff: s, password };
}
export async function resetStaffPassword(id: string): Promise<string> { const s = staffById(id)!; const pw = genPassword(); s.salt = b64(randBytes(16)); s.hash = await hashPw(pw, s.salt); s.mustChange = true; save(); return pw; }
export const setStaffStatus = (id: string, status: Staff["status"]) => { staffById(id)!.status = status; save(); };
export const setStaffRole = (id: string, role: RoleName, dept?: Dept) => { const s = staffById(id)!; s.role = role; if (dept) s.dept = dept; save(); };
export const removeStaff = (id: string) => { staff = staff.filter((s) => s.id !== id); save(); };
export const activeSupers = () => staff.filter((s) => s.role === "Super admin" && s.status === "active").length;

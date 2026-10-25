import { MIN } from "./rng";

export const money = (n: number) => "KSh " + Math.round(n).toLocaleString("en-KE");
export const minsSince = (t: number) => (Date.now() - t) / MIN;
export function ageTxt(t: number) {
  const m = Math.max(0, Math.floor(minsSince(t)));
  if (m < 1) return "just now";
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h " + (m % 60) + "m";
  return Math.floor(h / 24) + "d";
}
export const clock = (t: number) => new Date(t).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
export const dayClock = (t: number) => new Date(t).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
export const ageCls = (m: number, warm: number, hot: number) => (m >= hot ? "age hot" : m >= warm ? "age warm" : "age");
export const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
export const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

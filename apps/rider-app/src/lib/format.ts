export const money = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" });
}

export function countdown(iso: string): string {
  const s = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

/** Normalises 07xx / 01xx / 254xxx / +254xxx to +254XXXXXXXXX, or null if invalid. */
export function normalisePhone(input: string): string | null {
  const d = input.replace(/[^\d+]/g, "");
  let n = d;
  if (n.startsWith("+")) n = n.slice(1);
  if (n.startsWith("0")) n = "254" + n.slice(1);
  if (/^254[17]\d{8}$/.test(n)) return "+" + n;
  return null;
}

export const isMpesaCode = (s: string) => /^[A-Z0-9]{10}$/.test(s.trim().toUpperCase());

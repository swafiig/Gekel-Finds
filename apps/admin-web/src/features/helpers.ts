import { dist } from "@/lib/format";
import type { Dispute, Order, Rider, Supplier } from "@/lib/types";
import { minsSince } from "@/lib/format";
import { getDb, since } from "@/lib/store";

export const kmBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => Number((dist(a.x, a.y, b.x, b.y) * 0.032).toFixed(1));
export const needsAction = (o: Order) => {
  const c = getDb().config; const m = minsSince(since(o));
  return (o.status === "ready" && !o.rider) || (o.status === "payment_submitted" && m > c.payConfirmSla) || o.status === "disputed" || (o.status === "awaiting_payment" && m > 20);
};
export const scoreTone = (s = 0) => (s >= 90 ? "ok" : s >= 80 ? "acc" : "bad") as "ok" | "acc" | "bad";
export const dueTone = (d: number) => (d <= 7 ? "bad" : d <= 30 ? "warn" : "ok") as "bad" | "warn" | "ok";
export type { Dispute, Rider, Supplier };

import type { GiftRule, Holiday, Offer, Pricing } from "./types";

export interface QuoteIn { place: string; county?: string; speed: "standard" | "express"; items: number; date?: Date }
export interface QuoteOut {
  base: number; express: number; holiday: number; freeApplied: boolean; offer: Offer | null; offerSaving: number; total: number;
  lines: [string, number][]; courier?: string; days?: string; gifts: GiftRule[]; holidayNow: Holiday | null; note?: string;
}
const inRange = (h: Holiday, d: Date) => { const y = d.getFullYear(); const f = new Date(`${y}-${h.from}`), t = new Date(`${y}-${h.to}`); if (t < f) return d >= f || d <= t; return d >= f && d <= t; };
export const activeHoliday = (p: Pricing, d = new Date()) => p.holidays.find((h) => h.active && inRange(h, d)) ?? null;

/** What a buyer pays for delivery. Item money is separate; it goes straight to the supplier's Till. */
export function deliveryQuote(p: Pricing, q: QuoteIn): QuoteOut {
  const d = q.date ?? new Date(); const hol = activeHoliday(p, d); const lines: [string, number][] = [];
  const out: QuoteOut = { base: 0, express: 0, holiday: 0, freeApplied: false, offer: null, offerSaving: 0, total: 0, lines, gifts: [], holidayNow: hol };
  if (q.county && q.county !== "Nairobi") {
    const c = p.counties.find((x) => x.active && x.county === q.county);
    if (!c) { out.note = `No courier set up for ${q.county}. Add one under Up-country.`; return out; }
    out.base = c.fee; out.courier = c.courier; out.days = c.days; lines.push([`${c.courier} to ${q.county}`, c.fee]);
    out.total = c.fee; out.gifts = giftsFor(p, q.items, d); return out;
  }
  const z = p.zones.find((x) => x.active && x.area === q.place);
  const std = z ? z.std : p.fallbackStd; const exp = z ? z.exp : p.fallbackExp;
  out.base = std; lines.push([z ? `${z.area} standard` : "Other Nairobi standard", std]);
  if (q.speed === "express") { out.express = exp - std; lines.push(["Express upgrade", exp - std]); }
  let total = std + out.express;
  if (q.items >= p.freeOver && p.freeOver > 0 && (q.speed === "standard" || p.freeAppliesTo === "both")) { out.freeApplied = true; lines.push([`Free delivery over KSh ${p.freeOver.toLocaleString("en-KE")}`, -std]); total -= std; if (p.freeAppliesTo === "both") { lines.push(["Express upgrade waived", -out.express]); total -= out.express; } }
  if (hol && hol.extraFee) { out.holiday = hol.extraFee; lines.push([`${hol.name} surcharge`, hol.extraFee]); total += hol.extraFee; }
  const offers = p.offers.filter((o) => o.active && q.items >= o.minOrder && o.kind !== "service_free");
  let best: Offer | null = null, save = 0;
  offers.forEach((o) => { const s = o.kind === "delivery_pct" ? Math.round((total * o.value) / 100) : Math.min(total, o.value); if (s > save) { save = s; best = o; } });
  if (best && save > 0) { out.offer = best; out.offerSaving = save; lines.push([(best as Offer).name, -save]); total -= save; }
  out.total = Math.max(0, total); out.gifts = giftsFor(p, q.items, d); return out;
}
export function giftsFor(p: Pricing, items: number, d = new Date()): GiftRule[] {
  const hol = activeHoliday(p, d);
  return p.gifts.filter((g) => g.active && g.stock > 0 && items >= g.minOrder && (!g.holidayId || hol?.id === g.holidayId));
}

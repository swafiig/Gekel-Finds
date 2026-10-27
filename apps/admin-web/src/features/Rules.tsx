"use client";
import { useState } from "react";
import { useOverlay } from "@/components/Overlay";
import { Banner, EditTable, PageHead, PermButton, Pill, Tabs, type Col } from "@/components/ui";
import { RULE_LABELS, saveConfig } from "@/lib/actions";
import { savePricing } from "@/lib/actions2";
import { calcFee } from "@/lib/constants";
import { money } from "@/lib/format";
import { deliveryQuote, activeHoliday } from "@/lib/pricing";
import { can, useDb } from "@/lib/store";
import type { Config, CountyRate, ErrandType, GiftRule, Holiday, Offer, Pricing, Zone } from "@/lib/types";

const RULES: [string, [keyof Config, string, string][]][] = [
  ["Fees on every order", [["findFee", "KSh", "Charged on every order for sourcing the item."], ["baseDelivery", "KSh", "First kilometre included."], ["perKm", "KSh", "Added for each kilometre after the first."], ["servicePct", "%", "Percent of item value."], ["serviceCap", "KSh", "The service charge never exceeds this."], ["riderShare", "%", "Paid out of the delivery part of the fee."]]],
  ["Dispatch", [["offerSecs", "sec", "How long a rider has to accept before the next one is asked."], ["radiusKm", "km", "Riders farther than this from the pickup are skipped."], ["maxJobs", "", "Orders one rider can carry at once."]]],
  ["Timers", [["quoteWindow", "sec", "How long suppliers have to send quotes before buyers see them."], ["payConfirmSla", "min", "Overview flags suppliers who take longer than this."]]],
];
type Tab = "nairobi" | "offers" | "county" | "holiday" | "other" | "fees";
const uid = () => Math.random().toString(36).slice(2, 7);
const MMDD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export default function Rules() {
  const db = useDb()!; const { toast, confirm } = useOverlay(); const [tab, setTab] = useState<Tab>("nairobi"); const editable = can("config");
  const [cfg, setCfg] = useState<Config>({ ...db.config }); const [p, setP] = useState<Pricing>(() => JSON.parse(JSON.stringify(db.pricing)));
  const cfgChanged = (Object.keys(cfg) as (keyof Config)[]).filter((k) => cfg[k] !== db.config[k]);
  const pKeys = (Object.keys(p) as (keyof Pricing)[]).filter((k) => JSON.stringify(p[k]) !== JSON.stringify(db.pricing[k]));
  const n = cfgChanged.length + pKeys.length; const upd = <K extends keyof Pricing>(k: K, v: Pricing[K]) => setP((x) => ({ ...x, [k]: v }));
  const badDate = p.holidays.find((h) => !MMDD.test(h.from) || !MMDD.test(h.to) || !MMDD.test(h.cutoff));
  const save = () => {
    if (badDate) { toast(`Write dates as month-day, like 12-18. Check "${badDate.name}".`, "bad"); return; }
    confirm({ title: `Save ${n} change${n > 1 ? "s" : ""}?`, text: "New orders use these straight away. Orders already placed keep the fee they were quoted.", label: "Save changes", onOk: () => { saveConfig(cfg); savePricing(p); toast("Rules saved"); } });
  };
  const discard = () => { setCfg({ ...db.config }); setP(JSON.parse(JSON.stringify(db.pricing))); };
  const zCols: Col<Zone>[] = [{ key: "area", label: "Area", type: "text", width: 150 }, { key: "tier", label: "Tier", type: "select", options: ["A", "B", "C"], hint: "A is next to the hubs, C is far out" }, { key: "std", label: "Standard", type: "number", unit: "KSh" }, { key: "exp", label: "Express", type: "number", unit: "KSh" }, { key: "active", label: "On", type: "toggle" }];
  const oCols: Col<Offer>[] = [{ key: "name", label: "Offer", type: "text", width: 200 }, { key: "code", label: "Code", type: "text", width: 100, hint: "Leave blank to apply automatically" }, { key: "kind", label: "Type", type: "select", options: ["delivery_pct", "delivery_flat", "service_free"], hint: "delivery_pct: % off delivery. delivery_flat: KSh off delivery. service_free: no service charge" }, { key: "value", label: "Value", type: "number" }, { key: "minOrder", label: "Order over", type: "number", unit: "KSh" }, { key: "ends", label: "Ends", type: "text", width: 110, hint: "YYYY-MM-DD" }, { key: "active", label: "On", type: "toggle" }];
  const cCols: Col<CountyRate>[] = [{ key: "county", label: "County or town", type: "text", width: 120 }, { key: "courier", label: "Courier", type: "text", width: 130 }, { key: "fee", label: "Courier charge", type: "number", unit: "KSh" }, { key: "days", label: "Takes", type: "text", width: 120 }, { key: "handoff", label: "How the rider hands over", type: "text", width: 280 }, { key: "active", label: "On", type: "toggle" }];
  const hCols: Col<Holiday>[] = [{ key: "name", label: "Holiday", type: "text", width: 160 }, { key: "from", label: "From", type: "text", width: 70, hint: "Month-day, like 12-18" }, { key: "to", label: "To", type: "text", width: 70 }, { key: "cutoff", label: "Order by", type: "text", width: 70 }, { key: "extraFee", label: "Extra delivery", type: "number", unit: "KSh" }, { key: "note", label: "Message to buyers", type: "text", width: 280 }, { key: "active", label: "On", type: "toggle" }];
  const hn = (id: string) => p.holidays.find((h) => h.id === id)?.name ?? "Any time";
  const gRows = p.gifts.map((g) => ({ ...g, when: hn(g.holidayId) })); type GRow = (typeof gRows)[number];
  const gCols: Col<GRow>[] = [{ key: "name", label: "Gift rule", type: "text", width: 160 }, { key: "minOrder", label: "Order over", type: "number", unit: "KSh" }, { key: "item", label: "What they get", type: "text", width: 200 }, { key: "stock", label: "In stock", type: "number" }, { key: "when", label: "When", type: "select", options: ["Any time", ...p.holidays.map((h) => h.name)] }, { key: "active", label: "On", type: "toggle" }];
  const eCols: Col<ErrandType>[] = [{ key: "name", label: "Errand", type: "text", width: 240 }, { key: "price", label: "Price", type: "number", unit: "KSh", hint: "0 means a rider phones the buyer to quote" }, { key: "active", label: "On", type: "toggle" }];
  const hol = activeHoliday(p);
  return (
    <>
      <PageHead title="Pricing and rules" sub="Delivery fees by area, express and standard, free-delivery limits, offers, up-country couriers, holidays, gifts, and the fee formula. Save once at the bottom." />
      {hol && <Banner icon="gift">Today is inside <b>{hol.name}</b>. {hol.extraFee ? `A ${money(hol.extraFee)} holiday charge is added to Nairobi deliveries.` : "No extra charge."} {hol.note}</Banner>}
      <div className="grid g21">
        <section className="card">
          <Tabs<Tab> tabs={[["nairobi", "Nairobi areas"], ["offers", "Free delivery, offers"], ["county", "Up-country"], ["holiday", "Holidays and gifts"], ["other", "Errands, extras"], ["fees", "Fee formula"]]} value={tab} onChange={setTab} />
          {tab === "nairobi" && (<>
            <div className="sect"><h3>Delivery fee for each area</h3><p className="soft m-0">What a buyer pays GEKEL for delivery inside Nairobi. Standard is same day. Express goes out as soon as the order is packed. Areas not listed use the other-area fee.</p></div>
            <EditTable rows={p.zones} cols={zCols} onChange={(r) => upd("zones", r)} disabled={!editable} make={() => ({ id: "z" + uid(), area: "New area", tier: "B", std: 250, exp: 400, active: true })} addLabel="Add an area" />
            <div className="sect"><h3>Any other Nairobi area</h3><div className="grid g2"><label className="field"><span className="lbl">Standard</span><input className="input num" type="number" min={0} disabled={!editable} value={p.fallbackStd} onChange={(e) => upd("fallbackStd", +e.target.value || 0)} /></label><label className="field"><span className="lbl">Express</span><input className="input num" type="number" min={0} disabled={!editable} value={p.fallbackExp} onChange={(e) => upd("fallbackExp", +e.target.value || 0)} /></label></div></div>
          </>)}
          {tab === "offers" && (<>
            <div className="sect"><h3>Free delivery</h3>
              <div className="grid g2"><label className="field"><span className="lbl">Free delivery on item totals above (KSh)</span><input className="input num" type="number" min={0} disabled={!editable} value={p.freeOver} onChange={(e) => upd("freeOver", +e.target.value || 0)} /><span className="hint">Put 0 to turn free delivery off.</span></label>
                <label className="field"><span className="lbl">Applies to</span><select className="input" disabled={!editable} value={p.freeAppliesTo} onChange={(e) => upd("freeAppliesTo", e.target.value as Pricing["freeAppliesTo"])}><option value="standard">Standard only (express still pays its upgrade)</option><option value="both">Standard and express</option></select></label></div></div>
            <div className="sect"><h3>Offers</h3><p className="soft m-0">The buyer gets the single best delivery offer they qualify for. Offers with a code need the buyer to type it.</p></div>
            <EditTable rows={p.offers} cols={oCols} onChange={(r) => upd("offers", r)} disabled={!editable} make={() => ({ id: "o" + uid(), name: "New offer", code: "", kind: "delivery_flat" as Offer["kind"], value: 50, minOrder: 0, ends: `${new Date().getFullYear()}-12-31`, active: false })} addLabel="Add an offer" />
          </>)}
          {tab === "county" && (<>
            <div className="sect"><h3>Orders outside Nairobi</h3><p className="soft m-0">A GEKEL rider takes the sealed parcel to the courier's Nairobi office and sends the waybill photo. The buyer pays the courier's charge instead of the Nairobi delivery fee. Add the places you serve.</p></div>
            <EditTable rows={p.counties} cols={cCols} onChange={(r) => upd("counties", r)} disabled={!editable} make={() => ({ id: "c" + uid(), county: "New town", courier: "", fee: 500, days: "Next day", handoff: "Rider drops at the courier's Nairobi office.", active: false })} addLabel="Add a county" />
          </>)}
          {tab === "holiday" && (<>
            <div className="sect"><h3>Holiday seasons</h3><p className="soft m-0">Dates repeat every year, written month-day (12-18 means 18 December). Eid moves each year, so reset its dates yourself.</p></div>
            <EditTable rows={p.holidays} cols={hCols} onChange={(r) => upd("holidays", r)} disabled={!editable} make={() => ({ id: "h" + uid(), name: "New holiday", from: "01-01", to: "01-02", cutoff: "12-30", extraFee: 0, note: "", active: false })} addLabel="Add a holiday" />
            <div className="sect"><h3>Gifts with orders</h3><p className="soft m-0">Added to a delivery automatically when item totals pass the amount, while stock lasts. A gift tied to a holiday only appears during it.</p></div>
            <EditTable rows={gRows} cols={gCols} onChange={(r) => upd("gifts", r.map(({ when, ...g }) => ({ ...g, holidayId: p.holidays.find((h) => h.name === when)?.id ?? "" }) as GiftRule))} disabled={!editable} make={() => ({ id: "g" + uid(), name: "New gift", minOrder: 20000, item: "", stock: 0, holidayId: "", active: false, when: "Any time" })} addLabel="Add a gift rule" />
          </>)}
          {tab === "other" && (<>
            <div className="sect"><h3>Errand prices</h3></div>
            <EditTable rows={p.errands} cols={eCols} onChange={(r) => upd("errands", r)} disabled={!editable} make={() => ({ id: "e" + uid(), name: "New errand", price: 300, active: true })} addLabel="Add an errand type" />
            <div className="sect"><h3>Other prices</h3><div className="grid g2">
              <label className="field"><span className="lbl">Own-supplier delivery fee (KSh)</span><input className="input num" type="number" min={0} disabled={!editable} value={p.ownSupplierFee} onChange={(e) => upd("ownSupplierFee", +e.target.value || 0)} /><span className="hint">Charged to buyers who bring their own supplier and only use GEKEL riders.</span></label>
              <label className="field"><span className="lbl">Rent-a-Shelf per month (KSh)</span><input className="input num" type="number" min={0} disabled={!editable} value={p.shelfRent} onChange={(e) => upd("shelfRent", +e.target.value || 0)} /></label></div></div>
          </>)}
          {tab === "fees" && (
            <div className="grid gap-[22px] p-[18px]">{RULES.map(([g, items]) => (
              <div key={g}><h3 className="mb-2.5 mt-0 text-sm font-bold">{g}</h3>
                <div className="grid g2 gap-3.5">{items.map(([k, u, h]) => (
                  <div key={k} className="field"><label htmlFor={`c-${k}`}>{RULE_LABELS[k]}</label>
                    <div className="flex items-center gap-2"><input id={`c-${k}`} type="number" min={0} step="any" className={`input num max-w-[130px] ${cfg[k] !== db.config[k] ? "changed" : ""}`} value={cfg[k]} disabled={!editable} onChange={(e) => { const v = parseFloat(e.target.value); setCfg({ ...cfg, [k]: isNaN(v) ? 0 : v }); }} /><span className="muted">{u}</span></div>
                    <span className="hint">{h}</span></div>))}</div></div>))}
              <div className="card flat"><header><div><h2>What buyers would pay</h2><p>GEKEL fee, now and after your edits</p></div></header>
                <div className="tw"><table className="t sm"><thead><tr><th>Order</th><th className="r">Now</th><th className="r">New</th></tr></thead>
                  <tbody>{([[2500, 1.5], [8000, 3], [24000, 4.5]] as [number, number][]).map(([v, km]) => { const a = calcFee(v, km, db.config), b = calcFee(v, km, cfg); return (
                    <tr key={v}><td>{money(v)}, {km} km</td><td className="r num">{money(a)}</td><td className="r num"><b>{money(b)}</b> {a !== b && <Pill tone={b > a ? "warn" : "ok"} plain>{b > a ? "+" : "-"}{money(Math.abs(b - a))}</Pill>}</td></tr>); })}</tbody></table></div></div>
            </div>)}
        </section>
        <Try p={p} />
      </div>
      {n > 0 && (
        <div className="savebar"><span><b>{n} unsaved change{n > 1 ? "s" : ""}</b> <span className="opacity-70">New orders use these. Open orders keep theirs.</span></span>
          <span className="flex gap-2"><button className="btn sm ghost text-white" onClick={discard}>Discard</button><PermButton perm="config" className="btn sm primary" onClick={save}>Save changes</PermButton></span></div>)}
    </>
  );
}

/** Lets staff test any combination and see exactly what a buyer would be charged. Uses the unsaved draft. */
function Try({ p }: { p: Pricing }) {
  const [place, setPlace] = useState("Kilimani"); const [county, setCounty] = useState("Nairobi"); const [speed, setSpeed] = useState<"standard" | "express">("standard"); const [items, setItems] = useState(6500); const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const q = deliveryQuote(p, { place, county, speed, items, date: new Date(day) });
  return (
    <aside className="card" aria-label="Try a delivery"><header><div><h2>Try a delivery</h2><p>See what a buyer would pay with the rules as drafted</p></div></header>
      <div className="grid gap-3 p-[18px]">
        <label className="field"><span className="lbl">Going to</span><select className="input" value={county} onChange={(e) => setCounty(e.target.value)}><option>Nairobi</option>{p.counties.filter((c) => c.active).map((c) => <option key={c.id}>{c.county}</option>)}</select></label>
        {county === "Nairobi" && <>
          <label className="field"><span className="lbl">Area</span><select className="input" value={place} onChange={(e) => setPlace(e.target.value)}>{p.zones.filter((z) => z.active).map((z) => <option key={z.id}>{z.area}</option>)}<option>Somewhere else</option></select></label>
          <div className="seg" role="group" aria-label="Speed"><button aria-pressed={speed === "standard"} onClick={() => setSpeed("standard")}>Standard</button><button aria-pressed={speed === "express"} onClick={() => setSpeed("express")}>Express</button></div></>}
        <label className="field"><span className="lbl">Items total (KSh)</span><input className="input num" type="number" min={0} value={items} onChange={(e) => setItems(+e.target.value || 0)} /></label>
        <label className="field"><span className="lbl">Order date</span><input className="input" type="date" value={day} onChange={(e) => setDay(e.target.value)} /></label>
        <div className="card flat"><div className="tw"><table className="t sm"><tbody>{q.lines.map(([l, v], i) => <tr key={i}><td>{l}</td><td className={`r num ${v < 0 ? "text-ok" : ""}`}>{v < 0 ? "-" : ""}{money(Math.abs(v))}</td></tr>)}
          <tr><td><b>Buyer pays for delivery</b></td><td className="r num"><b>{money(q.total)}</b></td></tr></tbody></table></div></div>
        {q.note && <p className="errtxt m-0">{q.note}</p>}
        {q.days && <p className="soft m-0">Arrives: {q.days}</p>}
        {q.gifts.length > 0 ? <p className="m-0"><Pill tone="ok">Gift</Pill> {q.gifts.map((g) => g.item).join(" + ")}</p> : <p className="soft m-0">No gift at this amount.</p>}
        {q.holidayNow && <p className="soft m-0">{q.holidayNow.name}: {q.holidayNow.note}</p>}
      </div>
    </aside>
  );
}

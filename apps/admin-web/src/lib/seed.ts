import { AREAS, BUYERS, CATALOG, DEFAULT_CONFIG, HUBS, STATUS, VERIFIED_IDS, calcFee } from "./constants";
import { createExtra } from "./seed2";
import { MIN, ago, between, pick, reseed, rnd } from "./rng";
import type { Db, Dispute, FeePayment, Order, OrderLine, Request, RoleName, Rider, StatusKey, Supplier, Unmatched } from "./types";

type S0 = Omit<Supplier, "x" | "y">;
const sup0: S0[] = [
  { id: "s1", name: "ABC Fashion", owner: "Amina Hassan", stall: "Eastleigh Mall, Stall 14", hub: "Eastleigh", status: "verified", till: "441029", phone: "+254712000111", joined: 94, score: 96, orders: 412, disputeRate: 0.7, quoteMins: 3.1 },
  { id: "s2", name: "Al-Baraka Wholesale", owner: "Yusuf Abdi", stall: "12th Street, Block B", hub: "Eastleigh", status: "verified", till: "582910", phone: "+254722441002", joined: 120, score: 94, orders: 688, disputeRate: 1.1, quoteMins: 4.4 },
  { id: "s3", name: "Kamukunji Metals", owner: "Peter Mwangi", stall: "Jua Kali, Row 4", hub: "Kamukunji", status: "verified", till: "630118", phone: "+254733908871", joined: 77, score: 88, orders: 203, disputeRate: 2.4, quoteMins: 7.9 },
  { id: "s4", name: "Hodari Shoes", owner: "Hodari Otieno", stall: "Section 1, Stall 22", hub: "Eastleigh", status: "verified", till: "774420", phone: "+254712000222", joined: 61, score: 91, orders: 156, disputeRate: 1.3, quoteMins: 5.2 },
  { id: "s5", name: "Nairobi Leather Craft", owner: "Grace Njeri", stall: "Luthuli Ave, Plaza 1", hub: "Kamukunji", status: "verified", till: "501337", phone: "+254745120099", joined: 48, score: 79, orders: 91, disputeRate: 3.8, quoteMins: 11.6 },
  { id: "s6", name: "Star Electronics", owner: "Omar Farah", stall: "Eastleigh Plaza, F2-08", hub: "Eastleigh", status: "verified", till: "299081", phone: "+254701550123", joined: 33, score: 93, orders: 134, disputeRate: 0.9, quoteMins: 3.8 },
  { id: "s7", name: "Sufuria World", owner: "Mary Atieno", stall: "Kamukunji Grounds, 9", hub: "Kamukunji", status: "verified", till: "660245", phone: "+254722010345", joined: 29, score: 90, orders: 77, disputeRate: 1.5, quoteMins: 6.0 },
  { id: "s8", name: "Blue Nile Fabrics", owner: "Salim Noor", stall: "1st Avenue, Shop 31", hub: "Eastleigh", status: "suspended", till: "318800", phone: "+254733210765", joined: 70, score: 52, orders: 118, disputeRate: 9.1, quoteMins: 18.4, note: "Three tamper-seal mismatches in 14 days. Suspended pending review." },
  { id: "p1", name: "Dira Gents Wear", owner: "Kelvin Ochieng", stall: "Eastleigh Mall, Stall 3", hub: "Eastleigh", status: "pending", submitted: 31 * 60, till: "720334", tillName: "KELVIN OCHIENG", phone: "+254712776655", docs: { id: "ok", permit: "ok", stall: "ok", till: "ok", visit: "todo" }, visit: null, risk: [], notes: "" },
  { id: "p2", name: "Jua Kali Tools", owner: "Samuel Kariuki", stall: "Kamukunji, Row 11", hub: "Kamukunji", status: "pending", submitted: 26 * 60, till: "411902", tillName: "S K ENTERPRISES", phone: "+254722883310", docs: { id: "ok", permit: "todo", stall: "ok", till: "check", visit: "todo" }, visit: null, risk: ['Till name "S K ENTERPRISES" does not match owner "Samuel Kariuki". Ask for the business registration.'], notes: "" },
  { id: "p3", name: "Mama Zawadi Textiles", owner: "Zawadi Hamisi", stall: "12th Street, Block D", hub: "Eastleigh", status: "pending", submitted: 9 * 60, till: "558210", tillName: "ZAWADI HAMISI", phone: "+254745662200", docs: { id: "ok", permit: "ok", stall: "todo", till: "ok", visit: "todo" }, visit: null, risk: [], notes: "" },
  { id: "p4", name: "Eastleigh Phones Hub", owner: "Abdi Warsame", stall: "Eastleigh Plaza, G4-02", hub: "Eastleigh", status: "pending", submitted: 4 * 60, till: "902114", tillName: "ABDI WARSAME", phone: "+254701990880", docs: { id: "ok", permit: "ok", stall: "ok", till: "ok", visit: "done" }, visit: "Visited Tue 21 Oct by Wanjiru. Stall matches photos.", risk: ["Sells phones and accessories. Requires IMEI proof on high-value items."], notes: "" },
  { id: "p5", name: "Safari Boots Ltd", owner: "Nelson Kimani", stall: "Luthuli Ave, Shop 5", hub: "Kamukunji", status: "pending", submitted: 52 * 60, till: "335577", tillName: "SAFARI BOOTS LIMITED", phone: "+254733114477", docs: { id: "ok", permit: "ok", stall: "ok", till: "ok", visit: "done" }, visit: "Visited Mon 20 Oct by Wanjiru. Stock verified.", risk: [], notes: "" },
];

type R0 = Omit<Rider, "x" | "y" | "tx" | "ty" | "job" | "earn">;
const rid0: R0[] = [
  { id: "r1", name: "James Kamau", vehicle: "Honda 150", plate: "KMDG 419P", hub: "Eastleigh", status: "online", rating: 4.9, trips: 6, total: 1420, phone: "+254722100001", licence: 210, insurance: 48 },
  { id: "r2", name: "Peter Otieno", vehicle: "TVS 125", plate: "KMFD 220K", hub: "Eastleigh", status: "online", rating: 4.8, trips: 5, total: 982, phone: "+254722100002", licence: 140, insurance: 6 },
  { id: "r3", name: "Hassan Abdi", vehicle: "Boxer 150", plate: "KMEH 871T", hub: "Eastleigh", status: "online", rating: 4.7, trips: 7, total: 1211, phone: "+254722100003", licence: 300, insurance: 120 },
  { id: "r4", name: "Mercy Wanjiru", vehicle: "E-bike Ampere", plate: "KMGA 004E", hub: "Kamukunji", status: "online", rating: 5.0, trips: 4, total: 388, phone: "+254722100004", licence: 410, insurance: 200 },
  { id: "r5", name: "Daniel Mwangi", vehicle: "Honda 125", plate: "KMCZ 662M", hub: "Kamukunji", status: "online", rating: 4.6, trips: 6, total: 760, phone: "+254722100005", licence: 90, insurance: 30 },
  { id: "r6", name: "Fatuma Ali", vehicle: "TVS 125", plate: "KMFK 118N", hub: "Eastleigh", status: "online", rating: 4.9, trips: 3, total: 640, phone: "+254722100006", licence: 220, insurance: 75 },
  { id: "r7", name: "Samuel Kiptoo", vehicle: "Boxer 150", plate: "KMEG 509S", hub: "Kamukunji", status: "online", rating: 4.5, trips: 5, total: 530, phone: "+254722100007", licence: 60, insurance: 14 },
  { id: "r8", name: "Joseph Njoroge", vehicle: "Honda 150", plate: "KMDF 330L", hub: "Eastleigh", status: "offline", rating: 4.8, trips: 0, total: 1033, phone: "+254722100008", licence: 25, insurance: 90 },
  { id: "r9", name: "Ali Yusuf", vehicle: "TVS 125", plate: "KMGB 772D", hub: "Eastleigh", status: "offline", rating: 4.4, trips: 0, total: 299, phone: "+254722100009", licence: 180, insurance: 190 },
  { id: "r10", name: "Lucy Achieng", vehicle: "E-bike Ampere", plate: "KMGC 019E", hub: "Kamukunji", status: "offline", rating: 4.9, trips: 0, total: 412, phone: "+254722100010", licence: 330, insurance: 300 },
  { id: "r11", name: "Brian Mutua", vehicle: "Boxer 150", plate: "KMEJ 998B", hub: "Kamukunji", status: "suspended", rating: 3.9, trips: 0, total: 187, phone: "+254722100011", licence: 150, insurance: 150, note: "Delivery photo reused across two orders. Suspended 12 days ago." },
  { id: "r12", name: "Kevin Odhiambo", vehicle: "Honda 125", plate: "KMDK 841V", hub: "Eastleigh", status: "online", rating: 4.7, trips: 2, total: 98, phone: "+254722100012", licence: 400, insurance: 365 },
];

let orderSeq = 10480;
export function nextOrderSeq() { return ++orderSeq; }

export function makeOrder(db: Pick<Db, "suppliers" | "config">, status: StatusKey, ageMin: number): Order {
  const sid = pick(VERIFIED_IDS);
  const s = db.suppliers.find((x) => x.id === sid)!;
  const cat = CATALOG[sid];
  const lines: OrderLine[] = [];
  const n = rnd() < 0.3 ? 2 : 1;
  for (let i = 0; i < n; i++) { const [name, price] = pick(cat); lines.push({ n: name, q: between(1, price > 3000 ? 2 : 6), p: price }); }
  const itemsTotal = lines.reduce((a, l) => a + l.q * l.p, 0);
  const area = pick(Object.keys(AREAS));
  const km = Math.round((2 + rnd() * 8) * 10) / 10;
  const seq = nextOrderSeq();
  const o: Order = {
    id: "o" + seq, code: "#GK-" + seq, createdAt: ago(ageMin), status, buyer: pick(BUYERS), area, sid, hub: s.hub, lines, itemsTotal,
    km, fee: calcFee(itemsTotal, km, db.config), rider: null, mpesa: null, log: [], proofs: [], destX: AREAS[area].x, destY: AREAS[area].y,
  };
  const idx = STATUS[status].step;
  const stamp = (m: number) => ago(Math.max(0, ageMin - m));
  o.log.push({ at: o.createdAt, t: "Order created from accepted quote" });
  if (idx >= 1 || status === "cancelled") { o.mpesa = "S" + pick(["JK", "JJ", "IQ", "KB", "LM"]) + between(1000, 9999) + pick(["P2L9", "X8RD", "C5NN", "Q7TT"]); o.log.push({ at: stamp(4), t: `Buyer submitted M-Pesa code ${o.mpesa}` }); }
  if (idx >= 2) o.log.push({ at: stamp(9), t: `${s.name} confirmed KSh ${itemsTotal.toLocaleString("en-KE")} received` });
  if (idx >= 3) { o.log.push({ at: stamp(22), t: "Packing proof uploaded, seal scanned" }); o.proofs.push({ cap: "Packed and sealed", at: stamp(22), gps: s.stall, seal: true }); }
  if (idx >= 4) o.log.push({ at: stamp(25), t: "Marked ready for pickup, handoff code issued" });
  if (idx >= 5) o.log.push({ at: stamp(33), t: "Rider scanned seal and left the stall" });
  if (idx >= 6) { o.log.push({ at: stamp(58), t: "Delivered, customer PIN verified" }); o.proofs.push({ cap: "Handed to customer", at: stamp(58), gps: area, seal: true }); }
  if (status === "cancelled") o.log.push({ at: stamp(30), t: "Cancelled: buyer did not pay within 30 minutes" });
  return o;
}

export function createDb(user: { id: string; name: string; role: RoleName } = { id: "u0", name: "Rashid Mwangi", role: "Super admin" }): Db {
  reseed(); orderSeq = 10480;
  const suppliers: Supplier[] = sup0.map((s) => { const h = HUBS[s.hub]; return { ...s, x: h.x + between(-55, 55), y: h.y + between(-40, 40) }; });
  const riders: Rider[] = rid0.map((r) => { const h = HUBS[r.hub]; const x = h.x + between(-60, 60), y = h.y + between(-45, 45); return { ...r, x, y, tx: x, ty: y, job: null, earn: r.trips * 310 + between(0, 120) }; });
  const base = { suppliers, config: { ...DEFAULT_CONFIG } };

  const orders: Order[] = [];
  const plan: [StatusKey, number][] = [["delivered", 16], ["in_transit", 4], ["ready", 2], ["packed", 3], ["paid", 3], ["payment_submitted", 3], ["awaiting_payment", 3], ["cancelled", 1], ["disputed", 4]];
  plan.forEach(([st, c]) => {
    for (let i = 0; i < c; i++) {
      const age = st === "delivered" ? between(70, 560) : st === "in_transit" ? between(40, 55) : st === "ready" ? between(26, 30) : st === "packed" ? between(14, 24) : st === "paid" ? between(10, 20) : st === "payment_submitted" ? [6, 14, 21][i % 3] : st === "awaiting_payment" ? between(4, 26) : st === "cancelled" ? 95 : between(100, 300);
      orders.push(makeOrder(base, st, age));
    }
  });
  orders.sort((a, b) => b.createdAt - a.createdAt);
  const ofs = (st: StatusKey) => orders.filter((o) => o.status === st);
  ofs("ready")[0].createdAt = ago(34); ofs("ready")[0].log.push({ at: ago(5), t: "Offer sent to 3 riders. No one accepted." });
  const busy = ["r1", "r3", "r5", "r6"];
  ofs("in_transit").forEach((o, i) => {
    const r = riders.find((x) => x.id === busy[i])!; o.rider = r.id; r.status = "busy"; r.job = { order: o.id, phase: "deliver" };
    const s = suppliers.find((x) => x.id === o.sid)!; r.x = s.x + (o.destX - s.x) * 0.45; r.y = s.y + (o.destY - s.y) * 0.45; r.tx = o.destX; r.ty = o.destY;
  });
  orders.filter((o) => o.status === "delivered" || o.status === "disputed").forEach((o) => { o.rider = pick(riders.filter((r) => r.status !== "suspended")).id; });

  const requests: Request[] = [
    { id: "q1", code: "#RFQ-4093", title: "Embroidered black scarves", qty: 20, unit: "pcs", buyer: "Brian K.", hub: "Eastleigh", budget: 32000, at: ago(2), quotes: 0, status: "open" },
    { id: "q2", code: "#RFQ-4091", title: "Men's safari leather work boots", qty: 25, unit: "pairs", buyer: "Kelvin M.", hub: "Eastleigh", budget: 48000, at: ago(9), quotes: 2, status: "open" },
    { id: "q3", code: "#RFQ-4090", title: "Hotel cotton towels, white", qty: 600, unit: "pcs", buyer: "Upper Hill Hospitality", hub: "Kamukunji", budget: 150000, at: ago(14), quotes: 0, status: "open" },
    { id: "q4", code: "#RFQ-4088", title: "Heavy brass succulent planters", qty: 10, unit: "pcs", buyer: "Sarah O.", hub: "Kamukunji", budget: 6500, at: ago(22), quotes: 1, status: "open" },
    { id: "q5", code: "#RFQ-4086", title: "Kitenge cotton wax print, 6 yards", qty: 12, unit: "pcs", buyer: "Mama Zawadi", hub: "Eastleigh", budget: 17500, at: ago(31), quotes: 4, status: "open" },
    { id: "q6", code: "#RFQ-4084", title: "Wireless headphones, bulk", qty: 40, unit: "pcs", buyer: "Dennis L.", hub: "Eastleigh", budget: 120000, at: ago(47), quotes: 3, status: "matched" },
    { id: "q7", code: "#RFQ-4079", title: "Stainless sufuria sets", qty: 15, unit: "sets", buyer: "Halima S.", hub: "Kamukunji", budget: 55000, at: ago(66), quotes: 2, status: "matched" },
    { id: "q8", code: "#RFQ-4071", title: "Leather laptop bags", qty: 8, unit: "pcs", buyer: "Moses T.", hub: "Kamukunji", budget: 24000, at: ago(130), quotes: 0, status: "expired" },
  ];

  const disputes: Dispute[] = [
    { id: "DIS-882", order: null, kind: "Damaged on arrival", sev: "high", status: "open", openedBy: "Buyer", at: ago(48), sla: ago(48) + 90 * MIN, claim: '"The zipper jammed on the genuine leather handbag before the courier left the stall."', amount: 1850,
      evidence: [{ cap: "Photo 1: handoff at stall counter", at: ago(52), gps: "Eastleigh Mall, Stall 14", seal: true }, { cap: "Photo 2: zipper close-up by rider", at: ago(50), gps: "Eastleigh Mall, Stall 14", seal: true }, { cap: "Buyer photo on delivery", at: ago(44), gps: "Kilimani", seal: false }],
      chat: [["Rider", "Peter Otieno", "Zipper was fine in the morning but I tried pulling it lightly and tooth 14 is broken. I have not left the stall."], ["Support", "Karanja M.", "Thanks. Photo 2 shows the tooth clearly. Do not break the seal. Ask the supplier if an identical unit is in stock."], ["Rider", "Peter Otieno", "Supplier says identical unit is in stock."]] },
    { id: "DIS-879", order: null, kind: "Wrong item", sev: "med", status: "open", openedBy: "Buyer", at: ago(190), sla: ago(190) + 240 * MIN, claim: '"Ordered royal blue sufuria set, boxed forest green."', amount: 3200,
      evidence: [{ cap: "Seal scanned at pickup", at: ago(210), gps: "Kamukunji Grounds", seal: true }, { cap: "Buyer photo of open box", at: ago(170), gps: "South B", seal: false }],
      chat: [["Buyer", "Faith W.", "This is green. I paid for blue."], ["Support", "Karanja M.", "Sorry about that. We have asked the supplier to confirm what was packed."]] },
    { id: "DIS-874", order: null, kind: "Quantity short", sev: "med", status: "investigating", openedBy: "Buyer", at: ago(75), sla: ago(75) + 180 * MIN, claim: '"18 pieces in the bale instead of 20, and the supplier acknowledged the slip error."', amount: 24500,
      evidence: [{ cap: "Packing photo (bale sealed)", at: ago(120), gps: "Eastleigh, 12th St", seal: true }, { cap: "Count video still", at: ago(66), gps: "Umoja", seal: false }],
      chat: [["Buyer", "Omari K.", "Counted twice: 18."], ["Supplier", "Al-Baraka Wholesale", "Slip error. We can refund KSh 2,450 for the missing two."]] },
    { id: "DIS-871", order: null, kind: "Payment not received", sev: "high", status: "open", openedBy: "Supplier", at: ago(26), sla: ago(26) + 30 * MIN, claim: '"Buyer sent an M-Pesa code but nothing reached my Till."', amount: 8800,
      evidence: [{ cap: "Buyer M-Pesa message screenshot", at: ago(28), gps: "", seal: false }],
      chat: [["Supplier", "Star Electronics", "Code SJK4P2L9QA is not on my statement."], ["Buyer", "Naomi C.", "I paid, here is the SMS."]] },
    { id: "DIS-866", order: null, kind: "Rider no-show", sev: "low", status: "open", openedBy: "Supplier", at: ago(310), sla: ago(310) + 480 * MIN, claim: '"Rider accepted, never arrived. Parcel waited 40 minutes."', amount: 0,
      evidence: [{ cap: "Stall camera still, 40 min wait", at: ago(330), gps: "Eastleigh Plaza", seal: true }], chat: [["Supplier", "Hodari Shoes", "Waited, then handed to another rider."]] },
    { id: "DIS-859", order: null, kind: "Late delivery", sev: "low", status: "resolved", openedBy: "Buyer", at: ago(1200), sla: ago(1200) + 240 * MIN, ruling: "Buyer: GEKEL fee refunded", amount: 1650, claim: '"Arrived 90 minutes after the estimate."', evidence: [], chat: [] },
  ];
  const dOrders = orders.filter((o) => o.status === "disputed");
  disputes.slice(0, 4).forEach((d, i) => { d.order = dOrders[i].id; });
  disputes[4].order = orders.find((o) => o.status === "delivered")!.id;
  disputes[5].order = orders.filter((o) => o.status === "delivered")[1].id;
  disputes.forEach((d) => { const o = orders.find((x) => x.id === d.order); if (o) { d.buyer = o.buyer; d.sid = o.sid; o.dispute = d.id; if (d.amount === 0) d.amount = o.itemsTotal; } });

  const unmatched: Unmatched[] = [
    { ref: "SJL9R2KD4Q", amount: 450, phone: "+254712 *** 118", at: ago(7), hint: "Amount equals a fee for 2 open orders" },
    { ref: "SJL7M3TT0A", amount: 380, phone: "+254733 *** 902", at: ago(33), hint: "Paid from a different phone than the buyer" },
    { ref: "SJK2P8VV1C", amount: 520, phone: "+254701 *** 447", at: ago(95), hint: "No order with this amount in the last 3 hours" },
  ];
  const feeStream: FeePayment[] = [];
  orders.filter((o) => STATUS[o.status].step >= 2 || o.status === "disputed").slice(0, 18).forEach((o) => feeStream.push({ id: "f" + o.id, order: o.id, ref: "Q" + pick(["KB", "LM", "JR"]) + between(10000, 99999) + pick(["A", "X", "P"]), amount: o.fee, at: o.createdAt + 5 * MIN, state: "matched", ms: between(380, 2400) }));
  feeStream.push({ id: "f-x1", order: null, ref: "QKB88123XZ", amount: 410, at: ago(19), state: "failed", ms: 0, why: "Customer cancelled the STK prompt" });
  feeStream.push({ id: "f-x2", order: null, ref: "QLM44019TT", amount: 350, at: ago(41), state: "failed", ms: 0, why: "Insufficient M-Pesa balance" });
  feeStream.sort((a, b) => b.at - a.at);

  return {
    orders, suppliers, riders, requests, disputes, unmatched, feeStream, config: base.config,
    audit: [
      { at: ago(6), who: "Karanja Maina", act: "Reassigned rider", tgt: "#GK-10491", d: "Peter Otieno to Fatuma Ali (no response in 45s)" },
      { at: ago(21), who: "Wanjiru Kamau", act: "Marked document verified", tgt: "Safari Boots Ltd", d: "Business permit" },
      { at: ago(38), who: "Achieng Odera", act: "Messaged supplier", tgt: "Star Electronics", d: "Asked to confirm KSh 8,800 payment" },
      { at: ago(74), who: "Karanja Maina", act: "Ruled on dispute", tgt: "DIS-859", d: "Buyer: GEKEL fee refunded" },
      { at: ago(140), who: "Rashid Mwangi", act: "Changed fee rule", tgt: "Delivery per km", d: "KSh 18 to KSh 20" },
      { at: ago(210), who: "Farah Hussein", act: "Matched payment", tgt: "QKB62055AA", d: "To #GK-10473" },
      { at: ago(380), who: "Wanjiru Kamau", act: "Suspended supplier", tgt: "Blue Nile Fabrics", d: "Three tamper-seal mismatches" },
      { at: ago(1300), who: "Rashid Mwangi", act: "Invited team member", tgt: "achieng@gekel.co", d: "Support" },
    ],
    events: ["New request: Cotton bedsheets, 40 pcs", "Star Electronics quoted #RFQ-4091", "Karanja M. reassigned a rider on #GK-10491", "Hodari Shoes confirmed payment for #GK-10480"].map((txt, i) => ({ at: Date.now() - (i + 1) * 90000, txt, kind: "" })),
    hourly: { today: [2, 1, 0, 0, 1, 3, 9, 18, 31, 44, 52, 58, 61, 49, 40, 33, 0, 0, 0, 0, 0, 0, 0, 0], yest: [1, 0, 0, 0, 1, 2, 7, 15, 28, 39, 47, 55, 57, 52, 44, 38, 35, 30, 22, 17, 12, 8, 4, 2] },
    ui: { hub: "All", role: user.role, live: true, user },
    ...createExtra({ suppliers, riders, orders }),
  };
}

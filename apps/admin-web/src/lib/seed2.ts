import { MIN, ago, between, pick, rnd } from "./rng";
import type { AppHealth, AutoMsg, Campaign, Chama, Db, Errand, FindReq, Integration, Level, LogRow, OwnJob, PointsState, Pricing, QuoteAsk, RestockJob, ReturnReq, Service, Shelf, Template } from "./types";

const H = 60;
export function createPricing(): Pricing {
  const z = (area: string, tier: string, std: number, exp: number) => ({ id: "z-" + area.toLowerCase().replace(/[^a-z]/g, ""), area, tier, std, exp, active: true });
  return {
    zones: [z("Eastleigh", "A", 100, 200), z("Kamukunji", "A", 100, 200), z("CBD", "A", 120, 250), z("Ngara", "A", 120, 250), z("Pangani", "A", 150, 280),
      z("Donholm", "B", 200, 350), z("Umoja", "B", 220, 380), z("South B", "B", 200, 350), z("South C", "B", 220, 380), z("Kilimani", "B", 250, 400), z("Kileleshwa", "B", 250, 400), z("Parklands", "B", 250, 420), z("Westlands", "B", 280, 450), z("Lavington", "B", 300, 480),
      z("Kasarani", "C", 300, 480), z("Roysambu", "C", 280, 450), z("Lang'ata", "C", 320, 500), z("Ruaka", "C", 400, 600), z("Karen", "C", 400, 600), z("Rongai", "C", 450, 650), z("Kitengela", "C", 500, 700)],
    fallbackStd: 350, fallbackExp: 550, freeOver: 5000, freeAppliesTo: "standard",
    counties: [
      { id: "c1", county: "Kisumu", courier: "Ena Coach", fee: 500, days: "Next day", handoff: "Rider drops the sealed parcel at the courier's Nairobi parcel office and sends the waybill photo.", active: true },
      { id: "c2", county: "Nakuru", courier: "Fargo Courier", fee: 450, days: "Same or next day", handoff: "Rider drops at Fargo Nairobi depot. Waybill goes to the buyer by SMS.", active: true },
      { id: "c3", county: "Mombasa", courier: "Modern Coast", fee: 650, days: "Next day", handoff: "Rider drops at the bus company's parcel desk.", active: true },
      { id: "c4", county: "Eldoret", courier: "Eldoret Express", fee: 550, days: "Next day", handoff: "Rider drops at the bus company's parcel desk.", active: true },
      { id: "c5", county: "Nyeri", courier: "Fargo Courier", fee: 400, days: "Next day", handoff: "Rider drops at Fargo Nairobi depot.", active: false },
    ],
    offers: [
      { id: "o1", name: "First order, half price delivery", code: "KARIBU50", kind: "delivery_pct", value: 50, minOrder: 0, ends: "2026-12-31", active: true },
      { id: "o2", name: "Pay-day delivery discount", code: "PAYDAY", kind: "delivery_flat", value: 100, minOrder: 8000, ends: "2026-12-31", active: false },
      { id: "o3", name: "Service charge waived on big baskets", code: "", kind: "service_free", value: 0, minOrder: 20000, ends: "2026-12-31", active: true },
    ],
    holidays: [
      { id: "h1", name: "Festive season", from: "12-18", to: "01-02", note: "Order by 22 Dec for delivery before Christmas. Riders are fewer on 25 Dec and 1 Jan.", extraFee: 50, cutoff: "12-22", active: true },
      { id: "h2", name: "Valentine's", from: "02-08", to: "02-14", note: "Gift orders close at 6pm on 13 Feb.", extraFee: 0, cutoff: "02-13", active: true },
      { id: "h3", name: "Mother's Day", from: "05-04", to: "05-10", note: "Order by Friday for Sunday delivery.", extraFee: 0, cutoff: "05-08", active: true },
      { id: "h4", name: "Eid (set the dates each year)", from: "03-18", to: "03-22", note: "Some stalls close for the holiday. Orders may take a day longer.", extraFee: 0, cutoff: "03-17", active: false },
    ],
    gifts: [
      { id: "g1", name: "GEKEL merchandise pack", minOrder: 30000, item: "GEKEL tote bag + cap", stock: 120, holidayId: "", active: true },
      { id: "g2", name: "Festive gift pack", minOrder: 15000, item: "Boxed calendar + sweets", stock: 60, holidayId: "h1", active: true },
      { id: "g3", name: "Thank-you notebook", minOrder: 10000, item: "GEKEL notebook", stock: 0, holidayId: "", active: false },
    ],
    errands: [
      { id: "e1", name: "Queue for me", price: 300, active: true }, { id: "e2", name: "Pay a bill", price: 250, active: true }, { id: "e3", name: "Collect documents", price: 350, active: true },
      { id: "e4", name: "Buy a small item", price: 200, active: true }, { id: "e5", name: "Carry a parcel across town", price: 300, active: true }, { id: "e6", name: "Something else (quoted by phone)", price: 0, active: true },
    ],
    ownSupplierFee: 150, shelfRent: 1500,
  };
}

const BUYER_NAMES = ["Kelvin M.", "Sarah O.", "Brian K.", "Grace W.", "Joy W.", "Faith W.", "Omari K.", "Mama Zawadi", "Amina H.", "Peter N.", "Naomi C.", "Dennis L.", "Halima S.", "Moses T."];

export function createExtra(d: Pick<Db, "suppliers" | "riders" | "orders">): Omit<Db, "orders" | "suppliers" | "riders" | "requests" | "disputes" | "unmatched" | "feeStream" | "audit" | "events" | "config" | "hourly" | "ui"> {
  const phone = (i: number) => `07${10 + (i % 80)} ${100 + ((i * 37) % 800)} ${100 + ((i * 91) % 800)}`;
  const finds: FindReq[] = [
    { id: "f1", code: "FG-2041", title: "Black hoodie under KSh 2,000", detail: "Plain black, size L, thick fleece. No logos.", buyer: "Joy W.", phone: phone(1), hub: "Eastleigh", category: "Mavazi", budget: 2000, urgency: "standard", hasPhoto: false, stage: 1, agent: "Wanjiru Kamau", createdAt: ago(3 * H), notes: [{ at: ago(2 * H), who: "Wanjiru Kamau", t: "Checking Gikomba and Eastleigh Mall first." }] },
    { id: "f2", code: "FG-2040", title: "Kids school shoes, black, size 34", detail: "Leather, lace-up, for Class 6.", buyer: "Mama Zawadi", phone: phone(2), hub: "Eastleigh", category: "Viatu", budget: 1800, urgency: "sameDay", hasPhoto: true, stage: 0, agent: null, createdAt: ago(14), notes: [] },
    { id: "f3", code: "FG-2039", title: "Red Converse style sneakers, size 40", detail: "Canvas high-tops. Photo attached.", buyer: "Faith W.", phone: phone(3), hub: "Kamukunji", category: "Viatu", budget: 2500, urgency: "standard", hasPhoto: true, stage: 2, agent: "Wanjiru Kamau", createdAt: ago(26 * H), found: { supplier: "Gikomba Kicks", stall: "Gikomba, Row C, Stall 18", phone: "0722 410 118", price: 1900, at: ago(40) }, notes: [{ at: ago(40), who: "Wanjiru Kamau", t: "Found two pairs. Sent photo to buyer." }] },
    { id: "f4", code: "FG-2038", title: "Brass door knockers x6", detail: "Lion head, about 15 cm.", buyer: "Peter N.", phone: phone(4), hub: "Kamukunji", category: "Vifaa", budget: 9000, urgency: "standard", hasPhoto: false, stage: 3, agent: "Wanjiru Kamau", createdAt: ago(50 * H), found: { supplier: "Jua Kali Brass", stall: "Kamukunji Grounds, Row 7", phone: "0733 220 904", price: 7800, at: ago(30 * H) }, notes: [] },
    { id: "f5", code: "FG-2036", title: "Maasai shukas, 20 pieces", detail: "Mixed red and blue. For a wedding.", buyer: "Grace W.", phone: phone(5), hub: "Eastleigh", category: "Mavazi", budget: 30000, urgency: "standard", hasPhoto: false, stage: 4, agent: "Karanja Maina", createdAt: ago(60 * H), found: { supplier: "Maasai Market Collective", stall: "City Market, Block 3", phone: "0711 902 331", price: 26400, at: ago(40 * H) }, notes: [] },
    { id: "f6", code: "FG-2033", title: "Left-handed guitar strings", detail: "Nylon, any good brand.", buyer: "Dennis L.", phone: phone(6), hub: "Kamukunji", category: "Vifaa", budget: 1500, urgency: "standard", hasPhoto: false, stage: 5, agent: "Wanjiru Kamau", createdAt: ago(80 * H), found: { supplier: "Moi Avenue Music", stall: "Moi Ave, Shop 12", phone: "0720 118 442", price: 1200, at: ago(70 * H) }, notes: [] },
    { id: "f7", code: "FG-2031", title: "Baby stroller, foldable", detail: "Light, under 8 kg.", buyer: "Naomi C.", phone: phone(7), hub: "Eastleigh", category: "Watoto", budget: 9000, urgency: "standard", hasPhoto: false, stage: 1, closed: "not_found", agent: "Wanjiru Kamau", createdAt: ago(75 * H), notes: [{ at: ago(8 * H), who: "Wanjiru Kamau", t: "Three days, no match under KSh 9,000. Found one at 14,500." }] },
    { id: "f8", code: "FG-2042", title: "iPhone 11 back cover, clear", detail: "", buyer: "Moses T.", phone: phone(8), hub: "Eastleigh", category: "Simu", budget: 400, urgency: "sameDay", hasPhoto: false, stage: 0, agent: null, createdAt: ago(4), notes: [] },
  ];
  const ownJobs: OwnJob[] = [
    { id: "w1", code: "OS-311", buyer: "Mercy A.", phone: phone(11), sup: { name: "Mama Wambui, Gikomba", phone: "0722 330 881", location: "Gikomba Market, Section D", till: "" }, items: "2 bales of second-hand dresses", area: "Umoja", hub: "Eastleigh", value: 14000, fee: 370, stage: 1, rider: "r2", createdAt: ago(55), paidDirect: true, notes: [] },
    { id: "w2", code: "OS-310", buyer: "Hussein B.", phone: phone(12), sup: { name: "Kariuki Hardware", phone: "0733 118 220", location: "Ngara Road", till: "774812" }, items: "10 bags cement, 2 rolls of wire", area: "Kasarani", hub: "Kamukunji", value: 9500, fee: 450, stage: 0, rider: null, createdAt: ago(12), paidDirect: false, notes: [] },
    { id: "w3", code: "OS-309", buyer: "Esther K.", phone: phone(13), sup: { name: "Fresh Mboga Stall", phone: "0701 220 334", location: "Wakulima Market", till: "" }, items: "Veg crate, 3 sacks of onions", area: "Donholm", hub: "Eastleigh", value: 6200, fee: 350, stage: 2, rider: "r5", createdAt: ago(90), paidDirect: true, notes: [] },
    { id: "w4", code: "OS-306", buyer: "Mercy A.", phone: phone(11), sup: { name: "Luthuli Fabrics", phone: "0712 884 019", location: "Luthuli Ave, Plaza 2", till: "558211" }, items: "6 rolls of lining fabric", area: "Umoja", hub: "Kamukunji", value: 21000, fee: 370, stage: 3, rider: "r4", createdAt: ago(26 * H), paidDirect: false, notes: [] },
    { id: "w5", code: "OS-305", buyer: "Joseph N.", phone: phone(14), sup: { name: "Ngara Spares", phone: "0745 110 903", location: "Ngara, Park Road", till: "331920" }, items: "Motorbike spares box", area: "Kitengela", hub: "Eastleigh", value: 18500, fee: 650, stage: 3, rider: "r1", createdAt: ago(50 * H), paidDirect: false, notes: [] },
    { id: "w6", code: "OS-303", buyer: "Hussein B.", phone: phone(12), sup: { name: "Kariuki Hardware", phone: "0733 118 220", location: "Ngara Road", till: "774812" }, items: "Paint, 4 x 20L", area: "Kasarani", hub: "Kamukunji", value: 16000, fee: 450, stage: 3, rider: "r7", createdAt: ago(98 * H), paidDirect: false, notes: [] },
  ];
  const errands: Errand[] = [
    { id: "x1", code: "ER-511", type: "Queue for me", details: "Queue at Huduma Centre GPO for ID replacement. Opens 8am.", buyer: "Amina H.", phone: phone(21), area: "CBD", price: 300, stage: 2, runner: "Otieno (runner)", createdAt: ago(95) },
    { id: "x2", code: "ER-512", type: "Pay a bill", details: "Pay KPLC token KSh 1,500 for meter 0145 223 998.", buyer: "Peter N.", phone: phone(22), area: "Umoja", price: 250, stage: 0, runner: null, createdAt: ago(6) },
    { id: "x3", code: "ER-510", type: "Collect documents", details: "Collect sealed envelope from Ecobank Moi Ave, deliver to Westlands.", buyer: "Dennis L.", phone: phone(23), area: "Westlands", price: 350, stage: 1, runner: "Faith (runner)", createdAt: ago(40) },
    { id: "x4", code: "ER-509", type: "Buy a small item", details: "Buy 2 phone chargers (Type-C) at Eastleigh Plaza. Budget KSh 800.", buyer: "Halima S.", phone: phone(24), area: "South B", price: 200, stage: 3, runner: "Otieno (runner)", createdAt: ago(5 * H) },
    { id: "x5", code: "ER-508", type: "Carry a parcel across town", details: "Parcel from Ngara to Kilimani, 3 kg.", buyer: "Sarah O.", phone: phone(25), area: "Kilimani", price: 300, stage: 3, runner: "Faith (runner)", createdAt: ago(8 * H) },
    { id: "x6", code: "ER-513", type: "Something else (quoted by phone)", details: "Wait at KRA Times Tower for PIN certificate printing.", buyer: "Moses T.", phone: phone(26), area: "CBD", price: 0, stage: 0, runner: null, createdAt: ago(21) },
  ];
  const vs = d.suppliers.filter((s) => s.status === "verified");
  const qa = (i: number, buyer: string, product: string, sid: string, qty: number, note: string, status: QuoteAsk["status"], mins: number, price: number | null, took: number | null): QuoteAsk => ({ id: "qa" + i, buyer, product, sid, qty, note, status, price, at: ago(mins), answeredAt: took == null ? null : ago(mins) + took * MIN, nudges: 0 });
  const quoteAsks: QuoteAsk[] = [
    qa(1, "Kelvin M.", "Brown Leather Handbag", "s1", 12, "Is there a wholesale price? Need 12 for my shop.", "waiting", 4, null, null),
    qa(2, "Sarah O.", "Brass Planters", "s3", 30, "Can you do 30 by Friday?", "waiting", 11, null, null),
    qa(3, "Brian K.", "Wireless Headphones", "s6", 40, "", "waiting", 26, null, null),
    qa(4, "Grace W.", "Cotton Wax Print (6 yd)", "s2", 20, "Same pattern, 20 pieces", "answered", 55, 1380, 6),
    qa(5, "Omari K.", "Safari Work Boots", "s4", 8, "Sizes 42 to 45", "answered", 80, 2000, 3),
    qa(6, "Amina H.", "Leather Belts (12)", "s5", 3, "", "answered", 130, 4000, 22),
    qa(7, "Dennis L.", "Sufuria Set (5)", "s7", 15, "Delivery to Kasarani", "expired", 300, null, null),
    qa(8, "Naomi C.", "Phone Chargers (10)", "s6", 50, "", "answered", 190, 2650, 9),
  ];
  const returns: ReturnReq[] = [
    { id: "rt1", code: "RT-118", order: d.orders.find((o) => o.status === "delivered")?.id ?? null, buyer: "Faith W.", sid: "s4", item: "Black High Heels, size 38", reason: "Too small. Supplier sent size 37.", amount: 1650, status: "requested", payer: null, at: ago(25), hasPhoto: true, notes: [] },
    { id: "rt2", code: "RT-117", order: null, buyer: "Joy W.", sid: "s1", item: "Red Handbag", reason: "Strap came off on first use.", amount: 1650, status: "discussing", payer: null, at: ago(3 * H), hasPhoto: true, notes: [{ at: ago(2 * H), who: "Achieng Odera", t: "Asked ABC Fashion to confirm they will take it back." }] },
    { id: "rt3", code: "RT-115", order: null, buyer: "Kelvin M.", sid: "s6", item: "Power Bank 20k", reason: "Does not charge.", amount: 2600, status: "approved", payer: null, at: ago(6 * H), hasPhoto: true, notes: [] },
    { id: "rt4", code: "RT-112", order: null, buyer: "Mama Zawadi", sid: "s2", item: "Duvet Covers", reason: "Changed my mind", amount: 2800, status: "declined", payer: null, at: ago(30 * H), hasPhoto: false, notes: [{ at: ago(29 * H), who: "Supplier", t: "Opened and washed. Cannot take back." }] },
    { id: "rt5", code: "RT-109", order: null, buyer: "Omari K.", sid: "s7", item: "Cooking Pot 30cm", reason: "Dented lid", amount: 1500, status: "pickup_booked", payer: "supplier", at: ago(50 * H), hasPhoto: true, notes: [] },
    { id: "rt6", code: "RT-104", order: null, buyer: "Brian K.", sid: "s3", item: "Door Hinges (box)", reason: "Wrong size", amount: 1900, status: "refunded", payer: "supplier", at: ago(120 * H), hasPhoto: true, notes: [] },
  ];
  const chamas: Chama[] = [
    { id: "ch1", code: "CH-71", product: "Cooking Pot 30cm", unitPrice: 1200, targetQty: 24, payMode: "pre", status: "collecting", createdAt: ago(20 * H), hub: "Eastleigh", leader: "Mama Zawadi", area: "Umoja", members: [{ name: "Mama Zawadi", phone: phone(31), qty: 6, paid: true }, { name: "Halima S.", phone: phone(32), qty: 4, paid: true }, { name: "Amina H.", phone: phone(33), qty: 6, paid: false }] },
    { id: "ch2", code: "CH-70", product: "Cotton Wax Print (6 yd)", unitPrice: 1380, targetQty: 20, payMode: "post", status: "ready", createdAt: ago(40 * H), hub: "Eastleigh", leader: "Grace W.", area: "Donholm", members: [{ name: "Grace W.", phone: phone(34), qty: 8, paid: false }, { name: "Joy W.", phone: phone(35), qty: 6, paid: false }, { name: "Faith W.", phone: phone(36), qty: 6, paid: false }] },
    { id: "ch3", code: "CH-69", product: "Sufuria Set (5)", unitPrice: 3500, targetQty: 10, payMode: "pre", status: "ordered", createdAt: ago(90 * H), hub: "Kamukunji", leader: "Mary A.", area: "Kasarani", members: [{ name: "Mary A.", phone: phone(37), qty: 5, paid: true }, { name: "Esther K.", phone: phone(38), qty: 5, paid: true }] },
    { id: "ch4", code: "CH-66", product: "Phone Chargers (10)", unitPrice: 2400, targetQty: 20, payMode: "pre", status: "cancelled", createdAt: ago(200 * H), hub: "Eastleigh", leader: "Dennis L.", area: "South B", members: [{ name: "Dennis L.", phone: phone(39), qty: 4, paid: true }] },
  ];
  const restocks: RestockJob[] = [
    { id: "rs1", code: "RS-41", seller: "Zuri Online Shop", product: "Leather Belts (12)", qty: 24, wholesaler: "s5", stage: 1, createdAt: ago(3 * H), rider: "r4" },
    { id: "rs2", code: "RS-40", seller: "Mtaani Gadgets", product: "Phone Chargers (10)", qty: 60, wholesaler: "s6", stage: 0, createdAt: ago(40), rider: null },
    { id: "rs3", code: "RS-39", seller: "Zuri Online Shop", product: "Wallets (6)", qty: 30, wholesaler: "s5", stage: 2, createdAt: ago(20 * H), rider: "r7" },
    { id: "rs4", code: "RS-38", seller: "Baraka Kitchenware", product: "Sufuria Set (5)", qty: 12, wholesaler: "s7", stage: 3, createdAt: ago(46 * H), rider: "r5" },
  ];
  const shelves: Shelf[] = [
    { id: "sh1", seller: "Zuri Online Shop", hub: "Kamukunji", capacity: 200, used: 148, rentMonthly: 1500, since: ago(60 * 24 * H), paidUntil: Date.now() + 11 * 86400000, status: "active" },
    { id: "sh2", seller: "Mtaani Gadgets", hub: "Eastleigh", capacity: 150, used: 90, rentMonthly: 1500, since: ago(30 * 24 * H), paidUntil: Date.now() + 3 * 86400000, status: "active" },
    { id: "sh3", seller: "Baraka Kitchenware", hub: "Kamukunji", capacity: 100, used: 100, rentMonthly: 1000, since: ago(90 * 24 * H), paidUntil: Date.now() - 4 * 86400000, status: "overdue" },
    { id: "sh4", seller: "Nuru Styles", hub: "Eastleigh", capacity: 120, used: 35, rentMonthly: 1200, since: ago(10 * 24 * H), paidUntil: Date.now() + 20 * 86400000, status: "active" },
  ];
  const points: PointsState = {
    earnPer100: 1, bonus: 5, kshPerPoint: 1, expiryDays: 365, issued: 48210, redeemed: 12980,
    rewards: [{ id: "rw1", name: "KSh 100 off delivery", cost: 100, stock: 9999, active: true }, { id: "rw2", name: "Free express upgrade", cost: 150, stock: 9999, active: true }, { id: "rw3", name: "GEKEL tote bag", cost: 400, stock: 80, active: true }, { id: "rw4", name: "GEKEL cap", cost: 300, stock: 0, active: false }],
    members: BUYER_NAMES.slice(0, 8).map((n, i) => ({ name: n, phone: phone(40 + i), balance: 80 + ((i * 97) % 520), lifetime: 200 + ((i * 211) % 1900) })),
    ledger: [
      { at: ago(8), who: "Kelvin M.", kind: "earn", pts: 17, note: "Order GK-10488 delivered" }, { at: ago(30), who: "Sarah O.", kind: "redeem", pts: -100, note: "KSh 100 off delivery" },
      { at: ago(75), who: "Brian K.", kind: "earn", pts: 36, note: "Order GK-10479 delivered" }, { at: ago(3 * H), who: "Grace W.", kind: "adjust", pts: 50, note: "Apology for the late delivery. By Achieng Odera" },
      { at: ago(5 * H), who: "Mama Zawadi", kind: "redeem", pts: -400, note: "GEKEL tote bag" },
    ],
  };
  const campaigns: Campaign[] = [
    { id: "cm1", at: ago(3 * H), audience: "All verified suppliers", channels: ["sms", "push"], title: "Heavy rain on Juja Road", body: "Riders may be slower today. Please pack early and keep seals ready.", sent: 6, opened: 5, status: "sent", by: "Karanja Maina" },
    { id: "cm2", at: ago(26 * H), audience: "Buyers active in the last 30 days", channels: ["push", "inapp"], title: "Free delivery on orders over KSh 5,000", body: "This week only. Use the app, no code needed.", sent: 1420, opened: 611, status: "sent", by: "Rashid Mwangi" },
    { id: "cm3", at: ago(50 * H), audience: "All online riders", channels: ["push"], title: "New pickup point at Eastleigh Plaza", body: "Use the east gate from today.", sent: 9, opened: 9, status: "sent", by: "Karanja Maina" },
    { id: "cm4", at: Date.now() + 2 * 86400000, audience: "Buyers in Umoja and Donholm", channels: ["sms"], title: "Chama Buy now open", body: "Order together with neighbours and save. Open the app and tap Chama Buy.", sent: 0, opened: null, status: "scheduled", by: "Rashid Mwangi", scheduledFor: Date.now() + 2 * 86400000 },
  ];
  const templates: Template[] = [
    { id: "t1", name: "Please confirm payment", group: "Suppliers", body: "Hi {name}, a buyer has paid for order {order}. Please confirm in the app so we can send a rider." },
    { id: "t2", name: "Documents expiring", group: "Suppliers", body: "Hi {name}, your business permit expires soon. Please upload the new one in the GEKEL Seller app." },
    { id: "t3", name: "New feature for suppliers", group: "Suppliers", body: "Hi {name}, you can now answer Ask quote requests from the Quotes tab. Faster answers get more orders." },
    { id: "t4", name: "Order on the way", group: "Buyers", body: "Hi {name}, your order {order} is on the way. Keep your 4-digit code ready for the rider." },
    { id: "t5", name: "We found it", group: "Buyers", body: "Hi {name}, good news. GEKEL found {item}. Open the app to approve the price." },
    { id: "t6", name: "Holiday cut-off", group: "Buyers", body: "Order by {date} to get your gifts before the holiday. Delivery is free over KSh 5,000." },
    { id: "t7", name: "Rain alert", group: "Riders", body: "Heavy rain expected. Wrap parcels, ride safe, and message us if a road is blocked." },
    { id: "t8", name: "Insurance reminder", group: "Riders", body: "Hi {name}, your insurance expires in {days} days. Upload the new certificate in the app." },
  ];
  const A = (id: string, event: string, to: AutoMsg["to"], push: boolean, sms: boolean, inapp: boolean): AutoMsg => ({ id, event, to, push, sms, inapp });
  const autos: AutoMsg[] = [
    A("a1", "Order placed", "Supplier", true, true, true), A("a2", "Supplier sent a quote", "Buyer", true, false, true), A("a3", "Ask quote received", "Supplier", true, true, true), A("a4", "Quote answered", "Buyer", true, false, true),
    A("a5", "Payment confirmed", "Buyer", true, false, true), A("a6", "Packed and sealed", "Buyer", false, false, true), A("a7", "Rider assigned", "Buyer", true, false, true), A("a8", "Rider offer", "Rider", true, true, false),
    A("a9", "Out for delivery", "Buyer", true, true, true), A("a10", "Delivered", "Buyer", true, false, true), A("a11", "Find GEKEL: item found", "Buyer", true, true, true), A("a12", "Errand completed", "Buyer", true, false, true),
    A("a13", "Return approved", "Buyer", true, true, true), A("a14", "Points earned", "Buyer", false, false, true),
  ];
  const tech = createTech();
  return { finds, ownJobs, errands, quoteAsks, returns, chamas, restocks, shelves, points, campaigns, templates, autos, ...tech, pricing: createPricing(), logSeq: tech.logs.length } as never;
}

/* ---------- tech: app health, services, logs, integrations ---------- */
const series = (base: number, amp: number) => Array.from({ length: 24 }, (_, i) => Math.max(0, Math.round(base * (0.35 + 0.65 * Math.sin(((i - 5) / 24) * Math.PI * 1.9 + 0.2) ** 2) + between(-amp, amp))));
export function createTech(): Pick<Db, "apps" | "services" | "logs" | "integrations"> {
  const now = Date.now();
  const apps: AppHealth[] = [
    { key: "buyer", name: "GEKEL buyer app", platform: "Android + iOS (Expo)", state: "up", version: "1.4.2", latest: "1.4.2", minVersion: "1.3.0", maintenance: false, activeNow: 142, dau: 1860, series: series(150, 14), crashFree: 99.4, p95: 420, errPerMin: 0.4, uptime30: 99.96, installs: 5420, onLatest: 83, updatedAt: now },
    { key: "seller", name: "GEKEL seller app", platform: "Android (Expo)", state: "up", version: "0.9.6", latest: "0.9.6", minVersion: "0.9.0", maintenance: false, activeNow: 38, dau: 124, series: series(42, 6), crashFree: 98.9, p95: 510, errPerMin: 0.2, uptime30: 99.91, installs: 160, onLatest: 71, updatedAt: now },
    { key: "rider", name: "GEKEL rider app", platform: "Android (Expo)", state: "degraded", note: "Push notifications arriving 2 to 3 seconds late. Job offers still arrive.", version: "0.9.4", latest: "0.9.5", minVersion: "0.9.0", maintenance: false, activeNow: 11, dau: 12, series: series(12, 3), crashFree: 97.8, p95: 690, errPerMin: 1.1, uptime30: 99.7, installs: 14, onLatest: 57, updatedAt: now },
  ];
  const services: Service[] = [
    { id: "api", name: "GEKEL API", state: "up", latency: 84, checkedAt: now }, { id: "db", name: "Database", state: "up", latency: 9, checkedAt: now },
    { id: "daraja", name: "Daraja STK push", state: "up", latency: 380, checkedAt: now }, { id: "cb", name: "Daraja payment callbacks", state: "up", latency: 140, checkedAt: now },
    { id: "sms", name: "SMS gateway", state: "up", latency: 220, checkedAt: now }, { id: "fcm", name: "Push notifications", state: "degraded", latency: 2400, note: "Slow delivery reported by Google. Nothing to do on our side.", checkedAt: now },
    { id: "img", name: "Photo storage", state: "up", latency: 160, checkedAt: now }, { id: "maps", name: "Maps and distance", state: "up", latency: 190, checkedAt: now },
  ];
  const logs: LogRow[] = []; const fake = { logSeq: 0, logs, apps } as never as Db;
  for (let i = 0; i < 70; i++) { const l = makeLog(fake); l.at = now - (70 - i) * between(8000, 40000); }
  logs.sort((a, b) => b.at - a.at);
  const F = (key: string, label: string, set: boolean, secret = true, hint = "", last4 = ""): Integration["fields"][number] => ({ key, label, secret, set, hint, last4: set ? last4 : undefined });
  const integrations: Integration[] = [
    { id: "daraja", name: "M-Pesa Daraja", cat: "Payments", phase: "Start here", status: "sandbox", env: "sandbox", why: "Sends the STK push for the GEKEL fee and receives payment confirmations. Item money goes straight to supplier Tills and never touches this.", link: "https://developer.safaricom.co.ke", lastCheck: now - 4 * 60000,
      fields: [F("ck", "Consumer key", true, true, "From your app on the Daraja portal", "x9Qd"), F("cs", "Consumer secret", true, true, "", "p3Lm"), F("sc", "Shortcode (Paybill or Till)", true, false, "The number the GEKEL fee is paid to", "174379"), F("pk", "Passkey", false, true, "Safaricom gives you this when you go live"), F("cb", "Callback URL", false, false, "https://api.gekel.co/mpesa/callback")],
      steps: ["Create a free account at developer.safaricom.co.ke and add an app. You get a consumer key and secret for the sandbox straight away.", "Test the STK push in the sandbox with the test shortcode and test phone numbers on the portal.", "To go live you need a Paybill or Till registered to GEKEL. Apply for Go Live on the portal and Safaricom gives you the live passkey.", "Register your callback URL (must be https and public). Payments confirm only through this callback, never from a timer in the app.", "Paste the live key, secret, shortcode and passkey here, switch to Live, and run one real KSh 10 payment."] },
    { id: "sms", name: "SMS gateway (Africa's Talking)", cat: "Messaging", phase: "Start here", status: "not_connected", env: "n/a", why: "Order reminders to suppliers, rider offers, sign-in alerts and bulk messages. SMS reaches people with no data.", link: "https://africastalking.com", lastCheck: null,
      fields: [F("un", "Username", false, false), F("ak", "API key", false, true), F("sid", "Sender ID", false, false, "Your approved name, for example GEKEL")],
      steps: ["Create an Africa's Talking account and a Kenya application. Start in the sandbox.", "Apply for a sender ID (for example GEKEL). Approval by the networks can take several days, so do this first.", "Top up airtime credit for live sending. Check the per-message price on their dashboard.", "Copy the username and API key from Settings, paste them here, send a test to your own phone."] },
    { id: "fcm", name: "Push notifications (Firebase)", cat: "Push", phase: "Start here", status: "connected", env: "live", why: "Rider job offers, buyer order updates, supplier payment alerts. All three apps use it.", link: "https://firebase.google.com", lastCheck: now - 60000,
      fields: [F("pid", "Project ID", true, false, "", "kel-prod"), F("sa", "Service account key", true, true, "JSON from Project settings", "e91c")],
      steps: ["Create a Firebase project and add three Android apps, one for each GEKEL app, using their package names.", "Download google-services.json for each app and place it in the app project.", "In Project settings, Service accounts, generate a private key. The backend uses it to send pushes.", "Paste the project ID and key here. Send a test push to your own device."] },
    { id: "maps", name: "Maps and distance (Google Maps Platform)", cat: "Maps", phase: "Next", status: "sandbox", env: "sandbox", why: "Address search, pinning the drop-off, distance for delivery fees and rider routes.", link: "https://mapsplatform.google.com", lastCheck: now - 3600000,
      fields: [F("mk", "Maps API key (mobile)", true, true, "Restrict to your app package names", "7Hh2"), F("sk", "Server API key", false, true, "Restrict to your server address")],
      steps: ["Create a Google Cloud project and turn on billing. Maps has a free monthly credit but needs a card.", "Enable Maps SDK for Android, Places and Distance Matrix.", "Make two keys: one for the mobile apps and one for the server. Restrict both.", "Set a daily budget alert so a bug never runs up a bill."] },
    { id: "ena", name: "Ena Coach (parcel courier)", cat: "Couriers", phase: "Start here", status: "connected", env: "n/a", why: "Up-country orders such as Kisumu. No API: a rider drops the sealed parcel at their Nairobi office and the waybill photo goes to the buyer.", link: "", lastCheck: null, note: "Rates live under Rules, Up-country.",
      fields: [F("acct", "Account or contact", true, false, "Who at the courier you call", "0700")],
      steps: ["Visit or call the courier's Nairobi parcel office and agree a rate card and a pickup cut-off time.", "Ask for a corporate account so waybills are invoiced monthly, if they offer it.", "Enter the agreed rate under Rules, Up-country. Riders will see the drop-off address in the job."] },
    { id: "fargo", name: "Fargo Courier", cat: "Couriers", phase: "Next", status: "connected", env: "n/a", why: "Nakuru and other towns. Same manual hand-off as above.", link: "", lastCheck: null, fields: [F("acct", "Account or contact", true, false, "", "0711")], steps: ["Agree a rate card and the depot where riders drop parcels.", "Enter the rate under Rules, Up-country."] },
    { id: "sentry", name: "Crash and error reports (Sentry)", cat: "Monitoring", phase: "Next", status: "not_connected", env: "n/a", why: "Tells you when an app crashes on someone's phone, and why. Feeds the App health page.", link: "https://sentry.io", lastCheck: null,
      fields: [F("dsn", "DSN (buyer app)", false, true), F("dsn2", "DSN (seller app)", false, true), F("dsn3", "DSN (rider app)", false, true)], steps: ["Create a Sentry project for each app (React Native).", "Copy each project's DSN and paste it here.", "Add the Sentry package to each app and release a new version."] },
    { id: "img", name: "Photo storage (Cloudinary or S3)", cat: "Storage", phase: "Next", status: "not_connected", env: "n/a", why: "Packing photos, delivery proof, item photos in Find GEKEL.", link: "https://cloudinary.com", lastCheck: null,
      fields: [F("cn", "Cloud name", false, false), F("ak", "API key", false, true), F("as", "API secret", false, true)], steps: ["Create an account and note the cloud name.", "Create an upload preset that resizes photos to 1600 px so rider uploads stay small on mobile data.", "Paste the credentials here."] },
    { id: "wa", name: "WhatsApp Business", cat: "Messaging", phase: "Later", status: "not_connected", env: "n/a", why: "Many buyers prefer WhatsApp to SMS. Needs Meta approval and message templates.", link: "https://business.whatsapp.com", lastCheck: null, fields: [F("wt", "Access token", false, true), F("wp", "Phone number ID", false, false)], steps: ["Create a Meta business account and verify the business.", "Add a phone number and submit message templates for approval.", "Paste the token and phone number ID here."] },
    { id: "email", name: "Email (Resend or Postmark)", cat: "Messaging", phase: "Later", status: "not_connected", env: "n/a", why: "Receipts, weekly supplier statements, staff invites if you stop handing over passwords.", link: "", lastCheck: null, fields: [F("ek", "API key", false, true), F("ef", "From address", false, false)], steps: ["Pick a provider and verify the gekel.co domain (add the DNS records they give you).", "Paste the API key here."] },
    { id: "kra", name: "KRA eTIMS (tax invoices)", cat: "Other", phase: "Later", status: "not_connected", env: "n/a", why: "If GEKEL must issue tax invoices for its fees. Ask your accountant what applies before building.", link: "", lastCheck: null, fields: [F("pin", "KRA PIN", false, false)], steps: ["Ask your accountant whether GEKEL's fees need eTIMS invoices.", "If yes, register for eTIMS and follow KRA's integration guide."] },
  ];
  return { apps, services, logs, integrations };
}

/* ---------- log generator, used for the seed and for the live engine ---------- */
const LOG_T: [Level, string, (d: Db) => [string, Record<string, string | number>?]][] = [
  ["info", "api", () => [`POST /orders 201 in ${between(60, 220)} ms`, { route: "/orders", status: 201 }]],
  ["info", "api", () => [`GET /products?hub=Eastleigh 200 in ${between(30, 120)} ms`, { route: "/products", status: 200 }]],
  ["info", "daraja", () => [`STK push accepted, CheckoutRequestID ws_CO_${between(100000, 999999)}`, { ms: between(250, 900) }]],
  ["info", "daraja", () => [`Callback received: ResultCode 0, KSh ${pick([350, 410, 520, 280, 460])}`, { result: 0 }]],
  ["warn", "daraja", () => ["Callback ResultCode 1032: customer cancelled the prompt", { result: 1032 }]],
  ["warn", "daraja", () => ["Callback ResultCode 1: insufficient M-Pesa balance", { result: 1 }]],
  ["info", "sms", () => [`SMS sent to 07${between(10, 99)} *** ${between(100, 999)}: reminder to confirm payment`, { cost: 0.8 }]],
  ["warn", "sms", () => ["SMS delivery delayed over 30 s on Airtel", { network: "Airtel" }]],
  ["info", "buyer-app", () => [`Session started, app ${pick(["1.4.2", "1.4.2", "1.4.1"])}, Android ${pick([12, 13, 14])}`, { device: pick(["Tecno Spark", "Samsung A14", "Infinix Hot", "Redmi 12"]) }]],
  ["error", "buyer-app", () => [pick(["Unhandled promise rejection in CheckoutScreen", "Network request failed on /chat/send (offline queue used)", "Image upload timed out after 20 s"]), { version: "1.4.2" }]],
  ["info", "seller-app", () => [`Supplier confirmed payment for order GK-${between(10480, 10520)}`, {}]],
  ["error", "seller-app", () => ["Photo upload failed: 413 payload too large", { version: "0.9.6" }]],
  ["info", "rider-app", () => [`Rider accepted offer in ${between(6, 40)} s`, {}]],
  ["warn", "rider-app", () => ["Location updates paused: battery saver on", { rider: pick(["James Kamau", "Peter Otieno", "Daniel Mwangi"]) }]],
  ["error", "rider-app", () => ["Push token expired, refreshing", { version: "0.9.4" }]],
  ["warn", "push", () => [`FCM send took ${between(1800, 3200)} ms`, { ms: between(1800, 3200) }]],
  ["debug", "dispatch", () => [`Offer sent to ${between(1, 3)} riders within 4 km`, {}]],
  ["info", "admin", () => [`Staff ${pick(["karanja", "achieng", "farah"])}@gekel.co signed in`, {}]],
];
export function makeLog(d: Db, force?: Level): LogRow {
  let pool = LOG_T; if (force) pool = LOG_T.filter((x) => x[0] === force);
  else { const r = rnd(); pool = LOG_T.filter((x) => (r < 0.62 ? x[0] === "info" : r < 0.78 ? x[0] === "debug" || x[0] === "warn" : r < 0.9 ? x[0] === "warn" : x[0] === "error")); if (!pool.length) pool = LOG_T; }
  const [level, src, f] = pick(pool); const [msg, meta] = f(d);
  const row: LogRow = { id: ++d.logSeq, at: Date.now(), level, src, msg, meta: { req: "req_" + Math.random().toString(36).slice(2, 9), ...(meta ?? {}) } };
  d.logs.unshift(row); if (d.logs.length > 400) d.logs.pop(); return row;
}

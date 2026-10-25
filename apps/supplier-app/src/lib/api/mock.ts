/**
 * In-memory stand-in for the GEKEL backend so every supplier screen can be exercised
 * without a server. It enforces the same order state machine the real API must:
 *
 *  awaiting_payment -> payment_submitted -> paid -> packed -> ready
 *
 * Demo OTP for login: 123456.
 */
import {
  Api,
  ApiError,
  ChatMessage,
  ChatThread,
  Order,
  Product,
  ProductInput,
  Quote,
  Rfq,
  Session,
  SupplierProfile,
  SupplierSummary,
  User,
} from "./types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date();
const iso = (d: Date) => d.toISOString();
const ago = (mins: number) => iso(new Date(Date.now() - mins * 60_000));
const ahead = (mins: number) => iso(new Date(Date.now() + mins * 60_000));
let seq = 100;
const nid = (p: string) => `${p}_${++seq}`;

const DEMO_OTP = "123456";

/* ---------------- state ---------------- */

let user: User | null = null;

const supplier: SupplierProfile = {
  shopName: "ABC Fashion",
  stall: "Stall 14, Eastleigh Mall",
  hub: "Eastleigh",
  verified: true,
  tillNumber: "441029",
  whatsapp: "254712000111",
};

let products: Product[] = [
  { id: "p1", name: "Brown Leather Handbag", category: "Fashion & Bags", sku: "HB-841", price: 1850, stock: 64, tiers: [{ minQty: 10, price: 1650 }, { minQty: 100, price: 1300 }], active: true },
  { id: "p2", name: "Black High Heels", category: "Footwear", sku: "SH-302", price: 1650, stock: 22, tiers: [], active: true },
  { id: "p3", name: "Red Handbag", category: "Fashion & Bags", sku: "HB-512", price: 1650, stock: 4, tiers: [], active: true },
  { id: "p4", name: "Men's Safari Leather Work Boots", category: "Footwear", sku: "BT-908", price: 2100, stock: 35, tiers: [{ minQty: 10, price: 1900 }], active: true },
  { id: "p5", name: "Heavy Fleece Pull-overs", category: "Apparel", sku: "AP-201", price: 1200, stock: 0, tiers: [{ minQty: 20, price: 1000 }], active: true },
];

let rfqs: Rfq[] = [
  { id: "r1", code: "#RFQ-4091", title: "Men's Safari Leather Work Boots", description: "Size 42-45 mix. Need real leather, not PU.", qty: 25, unit: "pairs", buyerName: "Kelvin M.", buyerArea: "Westlands", budget: 48000, createdAt: ago(4), expiresAt: ahead(76), status: "open", threadId: "t1" },
  { id: "r2", code: "#RFQ-4088", title: "Heavy Brass Succulent Planters", description: "Plain finish, no engraving.", qty: 10, unit: "pcs", buyerName: "Sarah O.", buyerArea: "Kamukunji", budget: 6500, createdAt: ago(12), expiresAt: ahead(40), status: "quoted", quote: { price: 6200, readyInMins: 15, note: "Can do in two batches." }, threadId: "t3" },
  { id: "r3", code: "#RFQ-4093", title: "Embroidered Black Scarves", qty: 20, unit: "pcs", buyerName: "Brian K.", buyerArea: "Ngara", budget: 32000, createdAt: ago(1), expiresAt: ahead(110), status: "open" },
];

let orders: Order[] = [
  { id: "o1", code: "#GK-10482", createdAt: ago(35), status: "awaiting_payment", buyerName: "Kelvin M.", buyerArea: "Kilimani", buyerNote: "Please inspect zippers and pack with protective bubble-seal.", items: [{ name: "Brown Leather Handbag", qty: 1, unitPrice: 1850 }], itemsTotal: 1850, gekelFee: 350, threadId: "t1" },
  { id: "o2", code: "#GK-10460", createdAt: ago(55), status: "payment_submitted", buyerName: "Mama Zawadi", buyerArea: "Kilimani", items: [{ name: "Polo Shirts", qty: 20, unitPrice: 1300 }], itemsTotal: 26000, gekelFee: 480, payment: { mpesaCode: "SJK4P2L9QA", amount: 26000, submittedAt: ago(6) }, threadId: "t2" },
  { id: "o3", code: "#GK-10441", createdAt: ago(120), status: "paid", buyerName: "Amina H.", buyerArea: "South B", items: [{ name: "Black High Heels", qty: 2, unitPrice: 1650 }], itemsTotal: 3300, gekelFee: 300, payment: { mpesaCode: "SJJ2X8RD1M", amount: 3300, submittedAt: ago(90) } },
  { id: "o4", code: "#GK-10420", createdAt: ago(300), status: "delivered", buyerName: "Joy W.", buyerArea: "Parklands", items: [{ name: "Red Handbag", qty: 1, unitPrice: 1650 }], itemsTotal: 1650, gekelFee: 300, payment: { mpesaCode: "SIQ7C5NN0B", amount: 1650, submittedAt: ago(280) }, rider: { name: "James K.", plate: "KMDG 419P" } },
];


let threads: ChatThread[] = [
  { id: "t1", title: "Kelvin M.", subtitle: "Order #GK-10482", lastMessage: "Hi, is this available in black?", lastAt: ago(3), unread: 1 },
  { id: "t2", title: "Mama Zawadi", subtitle: "Order #GK-10460", lastMessage: "Paid, M-Pesa code sent.", lastAt: ago(6), unread: 0 },
  { id: "t3", title: "Sarah O.", subtitle: "Request #RFQ-4088", lastMessage: "Can you do KSh 6,000?", lastAt: ago(9), unread: 0 },
];
let messages: ChatMessage[] = [
  { id: "m1", threadId: "t1", mine: false, text: "Hi, is this available in black?", at: ago(3) },
  { id: "m2", threadId: "t2", mine: false, text: "Paid, M-Pesa code sent.", at: ago(6) },
  { id: "m3", threadId: "t3", mine: false, text: "Can you do KSh 6,000?", at: ago(9) },
];


/* ---------------- helpers ---------------- */

const need = <T>(v: T | undefined | null, msg: string): T => {
  if (v == null) throw new ApiError(msg, 404);
  return v;
};
const findOrder = (id: string) => need(orders.find((o) => o.id === id), "Order not found");
const requireAuth = () => {
  if (!user) throw new ApiError("Please sign in again", 401);
};
const randCode = (n: number) => Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function addMessage(threadId: string, mine: boolean, text: string) {
  const m: ChatMessage = { id: nid("m"), threadId, mine, text, at: iso(now()) };
  messages.push(m);
  const t = threads.find((x) => x.id === threadId);
  if (t) {
    t.lastMessage = text;
    t.lastAt = m.at;
    if (!mine) t.unread += 1;
  }
  return m;
}


/* ---------------- implementation ---------------- */

export const mockApi: Api = {
  async requestOtp(phone) {
    await delay();
    if (!/^\+254[17]\d{8}$/.test(phone)) throw new ApiError("Enter a valid Kenyan phone number", 400);
  },

  async verifyOtp(phone, code) {
    await delay();
    if (code !== DEMO_OTP) throw new ApiError("That code is not right. Try again.", 401);
    user = { id: "u_sup", name: "Amina Hassan", phone, role: "supplier" };
    const s: Session = { token: `mock.supplier.${Date.now()}`, user };
    return s;
  },

  async me() {
    await delay(150);
    requireAuth();
    return user!;
  },

  /* ----- supplier ----- */
  async getSupplierProfile() {
    await delay(200);
    requireAuth();
    return { ...supplier };
  },

  async updateSupplierProfile(p) {
    await delay();
    requireAuth();
    if (p.tillNumber !== undefined && !/^\d{5,7}$/.test(p.tillNumber)) throw new ApiError("Till or Paybill must be 5 to 7 digits", 400);
    Object.assign(supplier, p);
    return { ...supplier };
  },

  async getSupplierSummary(): Promise<SupplierSummary> {
    await delay(250);
    requireAuth();
    const c = (s: Order["status"][]) => orders.filter((o) => s.includes(o.status)).length;
    const todaySales = orders.filter((o) => o.status === "delivered").reduce((a, o) => a + o.itemsTotal, 0) + 82450 - 1650;
    return {
      newRequests: rfqs.filter((r) => r.status === "open").length,
      ordersInProgress: c(["awaiting_payment", "payment_submitted", "paid", "packed", "ready", "in_transit"]),
      toConfirm: c(["awaiting_payment", "payment_submitted"]),
      toPack: c(["paid"]),
      readyForPickup: c(["packed", "ready"]),
      completedToday: c(["delivered"]),
      todaySales,
      weekOrders: 41 + c(["delivered"]),
      weekSales: 318400 + todaySales,
      last7Days: [38000, 52000, 41000, 67000, 59000, 71000, todaySales],
    };
  },

  async listRfqs() {
    await delay(300);
    requireAuth();
    return rfqs.map((r) => ({ ...r })).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },

  async getRfq(id) {
    await delay(200);
    return { ...need(rfqs.find((r) => r.id === id), "Request not found") };
  },

  async submitQuote(rfqId, quote: Quote) {
    await delay(450);
    const r = need(rfqs.find((x) => x.id === rfqId), "Request not found");
    if (r.status !== "open" && r.status !== "quoted") throw new ApiError("This request is no longer open", 409);
    if (!(quote.price > 0)) throw new ApiError("Enter a price above zero", 400);
    r.quote = quote;
    r.status = "quoted";
    return { ...r };
  },

  async declineRfq(rfqId) {
    await delay(300);
    const r = need(rfqs.find((x) => x.id === rfqId), "Request not found");
    r.status = "declined";
    return { ...r };
  },

  async listProducts() {
    await delay(300);
    requireAuth();
    return products.map((p) => ({ ...p }));
  },

  async saveProduct(id, input: ProductInput) {
    await delay(500);
    requireAuth();
    if (!input.name.trim()) throw new ApiError("Product name is required", 400);
    if (!(input.price > 0)) throw new ApiError("Price must be above zero", 400);
    if (!input.photoUri) throw new ApiError("A product photo is required", 400);
    if (id) {
      const p = need(products.find((x) => x.id === id), "Product not found");
      Object.assign(p, input);
      return { ...p };
    }
    const p: Product = { id: nid("p"), active: true, ...input };
    products = [p, ...products];
    return { ...p };
  },

  async setProductStock(id, stock) {
    await delay(200);
    const p = need(products.find((x) => x.id === id), "Product not found");
    p.stock = Math.max(0, Math.floor(stock));
    return { ...p };
  },

  async deleteProduct(id) {
    await delay(250);
    products = products.filter((p) => p.id !== id);
  },

  async listOrders() {
    await delay(300);
    requireAuth();
    return orders.map((o) => ({ ...o })).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },

  async getOrder(id) {
    await delay(200);
    return { ...findOrder(id) };
  },

  async confirmPayment(orderId, receivedAmount) {
    await delay(500);
    const o = findOrder(orderId);
    if (o.status !== "payment_submitted") throw new ApiError("The buyer has not submitted a payment for this order yet", 409);
    if (receivedAmount !== o.itemsTotal) throw new ApiError(`Amount must match the order total of KSh ${o.itemsTotal.toLocaleString("en-KE")}. If it does not, report a payment problem.`, 400);
    o.status = "paid";
    return { ...o };
  },

  async disputePayment(orderId, reason) {
    await delay(400);
    const o = findOrder(orderId);
    if (o.status !== "payment_submitted") throw new ApiError("Nothing to dispute on this order", 409);
    o.status = "awaiting_payment";
    o.payment = undefined;
    addMessage(o.threadId ?? "t2", true, `Payment problem: ${reason}`);
    return { ...o };
  },

  async submitPackProof(orderId, proof) {
    await delay(600);
    const o = findOrder(orderId);
    if (o.status !== "paid") throw new ApiError("Confirm the buyer's payment before packing", 409);
    if (!proof.photoUri) throw new ApiError("A packing photo is required", 400);
    o.pack = { photoUri: proof.photoUri, sealSerial: proof.sealSerial?.trim() || undefined, at: iso(now()) };
    o.status = "packed";
    return { ...o };
  },

  async markReady(orderId) {
    await delay(500);
    const o = findOrder(orderId);
    if (o.status !== "packed") throw new ApiError("Upload packing proof first", 409);
    o.status = "ready";
    o.handoffCode = `GK-${o.code.replace(/\D/g, "")}-${randCode(3)}`;
    // Mock only: in production the API assigns a rider and notifies them.
    o.rider = { name: "James K.", plate: "KMDG 419P", etaMins: 12 };
    return { ...o };
  },

  /* ----- chat ----- */
  async listThreads() {
    await delay(250);
    return threads.map((t) => ({ ...t })).sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
  },
  async listMessages(threadId) {
    await delay(150);
    return messages.filter((m) => m.threadId === threadId);
  },
  async sendMessage(threadId, text) {
    await delay(150);
    if (!text.trim()) throw new ApiError("Message is empty", 400);
    return addMessage(threadId, true, text.trim());
  },
  async markThreadRead(threadId) {
    const t = threads.find((x) => x.id === threadId);
    if (t) t.unread = 0;
  },
};

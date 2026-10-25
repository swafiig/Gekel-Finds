export type Role = "supplier";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

/* ---------- Supplier ---------- */

export interface SupplierProfile {
  shopName: string;
  stall: string;
  hub: string;
  verified: boolean;
  /** Till / Paybill the buyer pays item money into. Shown to buyers at checkout. */
  tillNumber: string;
  whatsapp?: string;
}

export interface PriceTier {
  minQty: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  stock: number;
  photoUri?: string;
  tiers: PriceTier[];
  active: boolean;
}

export type ProductInput = Omit<Product, "id" | "active"> & { active?: boolean };

export type RfqStatus = "open" | "quoted" | "accepted" | "declined" | "expired";

export interface Quote {
  price: number;
  readyInMins: number;
  note?: string;
}

export interface Rfq {
  id: string;
  code: string;
  title: string;
  description?: string;
  qty: number;
  unit: string;
  buyerName: string;
  buyerArea: string;
  photoUri?: string;
  budget?: number;
  createdAt: string;
  expiresAt: string;
  status: RfqStatus;
  quote?: Quote;
  threadId?: string;
}

export type OrderStatus =
  | "awaiting_payment" // buyer has not paid the supplier yet
  | "payment_submitted" // buyer entered an M-Pesa code; supplier must confirm
  | "paid" // supplier confirmed payment; ready to pack
  | "packed" // packing proof uploaded
  | "ready" // handoff code issued, waiting for rider
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  photoUri?: string;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  status: OrderStatus;
  buyerName: string;
  buyerArea: string;
  buyerNote?: string;
  items: OrderItem[];
  itemsTotal: number;
  gekelFee: number;
  payment?: { mpesaCode: string; amount: number; submittedAt: string };
  pack?: { photoUri: string; sealSerial?: string; at: string };
  /** Shown to the supplier and scanned/typed by the rider at pickup. */
  handoffCode?: string;
  rider?: { name: string; plate: string; etaMins?: number };
  threadId?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  mine: boolean;
  text: string;
  photoUri?: string;
  at: string;
}

export interface SupplierSummary {
  newRequests: number;
  ordersInProgress: number;
  toConfirm: number;
  toPack: number;
  readyForPickup: number;
  completedToday: number;
  todaySales: number;
  weekOrders: number;
  weekSales: number;
  last7Days: number[];
}


/* ---------- API ---------- */
export interface Api {
  // auth
  requestOtp(phone: string): Promise<void>;
  verifyOtp(phone: string, code: string): Promise<Session>;
  me(): Promise<User>;
  registerPushToken?(token: string): Promise<void>;

  // supplier
  getSupplierProfile(): Promise<SupplierProfile>;
  updateSupplierProfile(p: Partial<Pick<SupplierProfile, "shopName" | "stall" | "tillNumber" | "whatsapp">>): Promise<SupplierProfile>;
  getSupplierSummary(): Promise<SupplierSummary>;
  listRfqs(): Promise<Rfq[]>;
  getRfq(id: string): Promise<Rfq>;
  submitQuote(rfqId: string, quote: Quote): Promise<Rfq>;
  declineRfq(rfqId: string, reason: "out_of_stock" | "cannot_fulfil" | "other"): Promise<Rfq>;
  listProducts(): Promise<Product[]>;
  saveProduct(id: string | null, input: ProductInput): Promise<Product>;
  setProductStock(id: string, stock: number): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;
  confirmPayment(orderId: string, receivedAmount: number): Promise<Order>;
  disputePayment(orderId: string, reason: string): Promise<Order>;
  submitPackProof(orderId: string, proof: { photoUri: string; sealSerial?: string }): Promise<Order>;
  markReady(orderId: string): Promise<Order>;


  // chat (shared)
  listThreads(): Promise<ChatThread[]>;
  listMessages(threadId: string): Promise<ChatMessage[]>;
  sendMessage(threadId: string, text: string): Promise<ChatMessage>;
  markThreadRead(threadId: string): Promise<void>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

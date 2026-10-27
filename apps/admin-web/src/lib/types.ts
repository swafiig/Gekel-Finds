export type HubName = "Eastleigh" | "Kamukunji";
export type HubFilter = "All" | HubName;
export type StatusKey = "awaiting_payment" | "payment_submitted" | "paid" | "packed" | "ready" | "in_transit" | "delivered" | "cancelled" | "disputed";
export type Tone = "" | "ok" | "warn" | "bad" | "acc" | "dk";
export type PermKey = "orders" | "suppliers" | "riders" | "disputes" | "payments" | "config" | "team" | "sourcing" | "comms" | "tech";
export type RoleName = "Super admin" | "Ops lead" | "Support" | "Verifier" | "Finance" | "Sourcing agent" | "Tech";
export type Dept = "Management" | "Operations" | "Sourcing" | "Logistics" | "Suppliers" | "Finance" | "Tech" | "Support";

export interface Proof { cap: string; at: number; gps: string; seal: boolean }
export interface LogEntry { at: number; t: string }
export interface OrderLine { n: string; q: number; p: number }

export interface Order {
  id: string; code: string; createdAt: number; status: StatusKey; buyer: string; area: string; sid: string; hub: HubName;
  lines: OrderLine[]; itemsTotal: number; km: number; fee: number; rider: string | null; mpesa: string | null;
  log: LogEntry[]; proofs: Proof[]; destX: number; destY: number; dispute?: string; noAuto?: boolean; slow?: boolean;
}

export type DocState = "ok" | "todo" | "check" | "done";
export interface Supplier {
  id: string; name: string; owner: string; stall: string; hub: HubName; status: "verified" | "pending" | "suspended";
  till: string; phone: string; x: number; y: number;
  joined?: number; score?: number; orders?: number; disputeRate?: number; quoteMins?: number; note?: string;
  submitted?: number; tillName?: string; docs?: Record<string, DocState>; visit?: string | null; risk?: string[]; notes?: string;
}

export interface Rider {
  id: string; name: string; vehicle: string; plate: string; hub: HubName; status: "online" | "busy" | "offline" | "suspended";
  rating: number; trips: number; total: number; phone: string; licence: number; insurance: number; note?: string;
  x: number; y: number; tx: number; ty: number; job: { order: string; phase: "pickup" | "deliver" } | null; earn: number;
}

export interface Request {
  id: string; code: string; title: string; qty: number; unit: string; buyer: string; hub: HubName; budget: number; at: number;
  quotes: number; status: "open" | "matched" | "expired";
}

export type ChatLine = [who: string, name: string, text: string];
export interface Dispute {
  id: string; order: string | null; kind: string; sev: "high" | "med" | "low"; status: "open" | "investigating" | "resolved";
  openedBy: string; at: number; sla: number; claim: string; amount: number; evidence: Proof[]; chat: ChatLine[];
  buyer?: string; sid?: string; ruling?: string; note?: string; resolvedAt?: number;
}

export interface Unmatched { ref: string; amount: number; phone: string; at: number; hint: string }
export interface FeePayment { id: string; order: string | null; ref: string; amount: number; at: number; state: "matched" | "failed"; ms: number; why?: string }
export interface AuditEntry { at: number; who: string; act: string; tgt: string; d: string }
export interface FeedEvent { at: number; txt: string; kind: string; fresh?: boolean }

export type Config = {
  findFee: number; baseDelivery: number; perKm: number; servicePct: number; serviceCap: number; riderShare: number;
  offerSecs: number; radiusKm: number; maxJobs: number; quoteWindow: number; payConfirmSla: number;
};

export interface Db {
  orders: Order[]; suppliers: Supplier[]; riders: Rider[]; requests: Request[]; disputes: Dispute[];
  unmatched: Unmatched[]; feeStream: FeePayment[]; audit: AuditEntry[]; events: FeedEvent[];
  config: Config; hourly: { today: number[]; yest: number[] };
  ui: { hub: HubFilter; role: RoleName; live: boolean; user: { id: string; name: string; role: RoleName } };
  finds: FindReq[]; ownJobs: OwnJob[]; errands: Errand[]; quoteAsks: QuoteAsk[]; returns: ReturnReq[]; chamas: Chama[];
  restocks: RestockJob[]; shelves: Shelf[]; points: PointsState; campaigns: Campaign[]; templates: Template[]; autos: AutoMsg[];
  apps: AppHealth[]; services: Service[]; logs: LogRow[]; integrations: Integration[]; pricing: Pricing; logSeq: number;
}

/* ---------- Find GEKEL (manual sourcing) ---------- */
export const FIND_STAGES = ["New", "Agent searching", "Found, buyer to approve", "Approved, buying", "Packed, to dispatch", "Delivered"] as const;
export interface FindReq {
  id: string; code: string; title: string; detail: string; buyer: string; phone: string; hub: HubName; category: string; budget: number;
  urgency: "sameDay" | "standard"; hasPhoto: boolean; stage: number; closed?: "not_found" | "cancelled"; agent: string | null; createdAt: number;
  found?: { supplier: string; stall: string; phone: string; price: number; at: number }; notes: { at: number; who: string; t: string }[]; invited?: boolean;
}

/* ---------- logistics-only buyers (their own supplier) ---------- */
export const OWN_STAGES = ["Requested", "Rider assigned", "Collected from supplier", "Delivered"] as const;
export interface OwnJob {
  id: string; code: string; buyer: string; phone: string; sup: { name: string; phone: string; location: string; till?: string };
  items: string; area: string; hub: HubName; value: number; fee: number; stage: number; rider: string | null; createdAt: number; cancelled?: boolean; paidDirect: boolean; notes: string[];
}

/* ---------- errands ---------- */
export const ERRAND_STAGES = ["Request sent", "Runner assigned", "In progress", "Completed"] as const;
export interface Errand { id: string; code: string; type: string; details: string; buyer: string; phone: string; area: string; price: number; stage: number; runner: string | null; createdAt: number; cancelled?: boolean }

/* ---------- ask quote ---------- */
export interface QuoteAsk { id: string; buyer: string; product: string; sid: string; qty: number; note: string; status: "waiting" | "answered" | "expired"; price: number | null; at: number; answeredAt: number | null; nudges: number }

/* ---------- Suluhu desk: returns ---------- */
export type ReturnState = "requested" | "discussing" | "approved" | "declined" | "pickup_booked" | "refunded";
export const RETURN_LABEL: Record<ReturnState, string> = { requested: "Requested", discussing: "Talking to supplier", approved: "Approved", declined: "Declined", pickup_booked: "Pickup booked", refunded: "Refunded" };
export interface ReturnReq { id: string; code: string; order: string | null; buyer: string; sid: string; item: string; reason: string; amount: number; status: ReturnState; payer: "buyer" | "supplier" | null; at: number; hasPhoto: boolean; notes: { at: number; who: string; t: string }[] }

/* ---------- Chama Buy ---------- */
export interface ChamaMember { name: string; phone: string; qty: number; paid: boolean }
export interface Chama { id: string; code: string; product: string; unitPrice: number; targetQty: number; payMode: "pre" | "post"; members: ChamaMember[]; status: "collecting" | "ready" | "ordered" | "cancelled"; createdAt: number; hub: HubName; leader: string; area: string }

/* ---------- Rent-a-Shelf ---------- */
export const RESTOCK_STAGES = ["Order placed with wholesaler", "Rider collecting", "At GEKEL sorting centre", "Stocked on shelf"] as const;
export interface RestockJob { id: string; code: string; seller: string; product: string; qty: number; wholesaler: string; stage: number; createdAt: number; rider: string | null }
export interface Shelf { id: string; seller: string; hub: HubName; capacity: number; used: number; rentMonthly: number; since: number; paidUntil: number; status: "active" | "overdue" }

/* ---------- GEKEL Points ---------- */
export interface Reward { id: string; name: string; cost: number; stock: number; active: boolean }
export interface PointsLine { at: number; who: string; kind: "earn" | "redeem" | "adjust"; pts: number; note: string }
export interface PointsMember { name: string; phone: string; balance: number; lifetime: number }
export interface PointsState { earnPer100: number; bonus: number; kshPerPoint: number; expiryDays: number; rewards: Reward[]; ledger: PointsLine[]; members: PointsMember[]; issued: number; redeemed: number }

/* ---------- comms ---------- */
export type Channel = "push" | "sms" | "inapp" | "whatsapp";
export interface Campaign { id: string; at: number; audience: string; channels: Channel[]; title: string; body: string; sent: number; opened: number | null; status: "sent" | "scheduled" | "failed"; by: string; scheduledFor?: number }
export interface Template { id: string; name: string; group: "Buyers" | "Suppliers" | "Riders"; body: string }
export interface AutoMsg { id: string; event: string; to: "Buyer" | "Supplier" | "Rider"; push: boolean; sms: boolean; inapp: boolean }

/* ---------- tech ---------- */
export type AppKey = "buyer" | "seller" | "rider";
export type Svc = "up" | "degraded" | "down";
export interface AppHealth {
  key: AppKey; name: string; platform: string; state: Svc; note?: string; version: string; minVersion: string; latest: string; maintenance: boolean;
  activeNow: number; dau: number; series: number[]; crashFree: number; p95: number; errPerMin: number; uptime30: number; installs: number; onLatest: number; updatedAt: number;
}
export interface Service { id: string; name: string; state: Svc; latency: number; note?: string; checkedAt: number }
export type Level = "debug" | "info" | "warn" | "error";
export interface LogRow { id: number; at: number; level: Level; src: string; msg: string; meta?: Record<string, string | number> }
export interface IntegrationField { key: string; label: string; secret?: boolean; set: boolean; last4?: string; hint?: string }
export interface Integration {
  id: string; name: string; cat: "Payments" | "Messaging" | "Maps" | "Push" | "Couriers" | "Monitoring" | "Storage" | "Other"; why: string; phase: "Start here" | "Next" | "Later";
  status: "connected" | "sandbox" | "not_connected" | "error"; env: "sandbox" | "live" | "n/a"; fields: IntegrationField[]; steps: string[]; link: string; lastCheck: number | null; note?: string; custom?: boolean;
}

/* ---------- pricing and rules ---------- */
export interface Zone { id: string; area: string; tier: string; std: number; exp: number; active: boolean }
export interface CountyRate { id: string; county: string; courier: string; fee: number; days: string; handoff: string; active: boolean }
export interface Offer { id: string; name: string; code: string; kind: "delivery_pct" | "delivery_flat" | "service_free"; value: number; minOrder: number; ends: string; active: boolean }
export interface Holiday { id: string; name: string; from: string; to: string; note: string; extraFee: number; cutoff: string; active: boolean }
export interface GiftRule { id: string; name: string; minOrder: number; item: string; stock: number; holidayId: string; active: boolean }
export interface ErrandType { id: string; name: string; price: number; active: boolean }
export interface Pricing {
  zones: Zone[]; fallbackStd: number; fallbackExp: number; freeOver: number; freeAppliesTo: "standard" | "both";
  counties: CountyRate[]; offers: Offer[]; holidays: Holiday[]; gifts: GiftRule[]; errands: ErrandType[]; ownSupplierFee: number; shelfRent: number;
}

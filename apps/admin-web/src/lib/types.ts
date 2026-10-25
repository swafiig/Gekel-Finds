export type HubName = "Eastleigh" | "Kamukunji";
export type HubFilter = "All" | HubName;
export type StatusKey = "awaiting_payment" | "payment_submitted" | "paid" | "packed" | "ready" | "in_transit" | "delivered" | "cancelled" | "disputed";
export type Tone = "" | "ok" | "warn" | "bad" | "acc" | "dk";
export type PermKey = "orders" | "suppliers" | "riders" | "disputes" | "payments" | "config" | "team";
export type RoleName = "Super admin" | "Ops lead" | "Support" | "Verifier" | "Finance";

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
export interface TeamMember { id: string; name: string; email: string; role: RoleName; last: string; mfa: boolean }
export interface AuditEntry { at: number; who: string; act: string; tgt: string; d: string }
export interface FeedEvent { at: number; txt: string; kind: string; fresh?: boolean }

export type Config = {
  findFee: number; baseDelivery: number; perKm: number; servicePct: number; serviceCap: number; riderShare: number;
  offerSecs: number; radiusKm: number; maxJobs: number; quoteWindow: number; payConfirmSla: number;
};

export interface Db {
  orders: Order[]; suppliers: Supplier[]; riders: Rider[]; requests: Request[]; disputes: Dispute[];
  unmatched: Unmatched[]; feeStream: FeePayment[]; team: TeamMember[]; audit: AuditEntry[]; events: FeedEvent[];
  config: Config; hourly: { today: number[]; yest: number[] };
  ui: { hub: HubFilter; role: RoleName; live: boolean };
}

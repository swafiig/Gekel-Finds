export type Role = "rider";

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

/* ---------- Rider ---------- */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface JobStop {
  name: string;
  detail: string;
  area: string;
  point: GeoPoint;
  phone?: string;
}

export interface Job {
  id: string;
  orderCode: string;
  pickup: JobStop;
  dropoff: JobStop & { note?: string };
  parcel: string;
  fragile: boolean;
  distanceKm: number;
  etaMins: number;
  payout: number;
  offeredAt: string;
  expiresAt: string;
}

export type DeliveryStage = "to_pickup" | "picked_up" | "in_transit" | "arrived" | "delivered";

export interface Delivery extends Job {
  stage: DeliveryStage;
  acceptedAt: string;
  deliveredAt?: string;
  tip?: number;
}

export interface RiderProfile {
  vehicle: string;
  plate: string;
  zone: string;
  rating: number;
  completedTotal: number;
  online: boolean;
}

export interface Earnings {
  todayTotal: number;
  todayTrips: number;
  todayDistanceKm: number;
  weekTotal: number;
  weekTrips: number;
  recent: Array<{ id: string; orderCode: string; area: string; amount: number; tip: number; at: string }>;
}


/* ---------- API ---------- */
export interface Api {
  // auth
  requestOtp(phone: string): Promise<void>;
  verifyOtp(phone: string, code: string): Promise<Session>;
  me(): Promise<User>;
  registerPushToken?(token: string): Promise<void>;

  // rider
  getRiderProfile(): Promise<RiderProfile>;
  setOnline(online: boolean): Promise<RiderProfile>;
  sendLocation(point: GeoPoint, deliveryId?: string): Promise<void>;
  listOffers(): Promise<Job[]>;
  acceptJob(jobId: string): Promise<Delivery>;
  declineJob(jobId: string): Promise<void>;
  getActiveDelivery(): Promise<Delivery | null>;
  confirmPickup(deliveryId: string, input: { code: string; photoUri: string }): Promise<Delivery>;
  startTransit(deliveryId: string): Promise<Delivery>;
  markArrived(deliveryId: string): Promise<Delivery>;
  completeDelivery(deliveryId: string, input: { otp: string; photoUri: string }): Promise<Delivery>;
  listDeliveries(): Promise<Delivery[]>;
  getEarnings(): Promise<Earnings>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

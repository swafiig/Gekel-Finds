/**
 * In-memory stand-in for the GEKEL backend so every rider screen can be exercised
 * without a server. Enforces the delivery state machine:
 *
 *  to_pickup -> picked_up -> in_transit -> arrived -> delivered
 *
 * Demo OTP for login: 123456. Demo seal codes and customer PIN are in MOCK_HINTS.
 */
import { Api, ApiError, Delivery, Earnings, Job, RiderProfile, Session, User } from "./types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date();
const iso = (d: Date) => d.toISOString();
const ago = (mins: number) => iso(new Date(Date.now() - mins * 60_000));
const ahead = (mins: number) => iso(new Date(Date.now() + mins * 60_000));

const DEMO_OTP = "123456";
const DELIVERY_PIN = "4821";

/* ---------------- state ---------------- */

let user: User | null = null;
const deliveryPins: Record<string, string> = {}; // orderCode -> release PIN the buyer holds

let riderOnline = false;
const rider: RiderProfile = { vehicle: "Honda 150", plate: "KMDG 419P", zone: "Eastleigh & Kamukunji", rating: 4.9, completedTotal: 1420, online: false };
let offers: Job[] = [
  {
    id: "j1", orderCode: "#GK-8821", parcel: "1 carton, handbags & apparel", fragile: true, distanceKm: 6.2, etaMins: 25, payout: 350,
    pickup: { name: "ABC Fashion", detail: "Stall 14, 1st Floor, Eastleigh Mall", area: "Eastleigh", point: { lat: -1.2742, lng: 36.8466 }, phone: "+254712000111" },
    dropoff: { name: "Kelvin M.", detail: "Apt 4B, Wood Avenue Plaza, Floor 4", area: "Kilimani", point: { lat: -1.2921, lng: 36.7844 }, phone: "+254712000999", note: "Tell gate security you're dropping a package for House 4B. Buzz intercom 04." },
    offeredAt: iso(now()), expiresAt: ahead(1),
  },
  {
    id: "j2", orderCode: "#GK-8830", parcel: "2 pairs of heels, boxed", fragile: false, distanceKm: 4.1, etaMins: 18, payout: 300,
    pickup: { name: "Hodari Shoes", detail: "Stall 22, Section 1, Eastleigh", area: "Eastleigh", point: { lat: -1.2755, lng: 36.8491 }, phone: "+254712000222" },
    dropoff: { name: "Amina H.", detail: "Mtaa Rd, House 12", area: "South B", point: { lat: -1.3074, lng: 36.8333 }, phone: "+254712000888" },
    offeredAt: iso(now()), expiresAt: ahead(1),
  },
];
let deliveries: Delivery[] = [];
const handoffByOrder: Record<string, string> = { "#GK-8821": "SEC-9980-NBO", "#GK-8830": "GK-10441-ABC" };
deliveryPins["#GK-8821"] = DELIVERY_PIN;
deliveryPins["#GK-8830"] = DELIVERY_PIN;
const completedHistory: Earnings["recent"] = [
  { id: "h1", orderCode: "#GK-8790", area: "Kilimani", amount: 320, tip: 50, at: ago(150) },
  { id: "h2", orderCode: "#GK-8784", area: "Westlands", amount: 410, tip: 0, at: ago(215) },
  { id: "h3", orderCode: "#GK-8771", area: "CBD", amount: 250, tip: 0, at: ago(290) },
];


/* ---------------- helpers ---------------- */

const need = <T>(v: T | undefined | null, msg: string): T => {
  if (v == null) throw new ApiError(msg, 404);
  return v;
};
const requireAuth = () => {
  if (!user) throw new ApiError("Please sign in again", 401);
};

/* ---------------- implementation ---------------- */

export const mockApi: Api = {
  async requestOtp(phone) {
    await delay();
    if (!/^\+254[17]\d{8}$/.test(phone)) throw new ApiError("Enter a valid Kenyan phone number", 400);
  },

  async verifyOtp(phone, code) {
    await delay();
    if (code !== DEMO_OTP) throw new ApiError("That code is not right. Try again.", 401);
    user = { id: "u_rid", name: "James Kamau", phone, role: "rider" };
    const s: Session = { token: `mock.rider.${Date.now()}`, user };
    return s;
  },

  async me() {
    await delay(150);
    requireAuth();
    return user!;
  },

  async getRiderProfile() {
    await delay(200);
    requireAuth();
    return { ...rider, online: riderOnline };
  },
  async setOnline(online) {
    await delay(300);
    if (!online && deliveries.some((d) => d.stage !== "delivered")) throw new ApiError("Finish your current delivery before going offline", 409);
    riderOnline = online;
    return { ...rider, online };
  },
  async sendLocation() {
    /* the real API fans this out to the buyer's tracking screen */
  },
  async listOffers() {
    await delay(250);
    if (!riderOnline || deliveries.some((d) => d.stage !== "delivered")) return [];
    // Mock only: keep offers alive so the demo never goes quiet.
    offers = offers.map((j) => (+new Date(j.expiresAt) < Date.now() ? { ...j, offeredAt: iso(now()), expiresAt: ahead(1) } : j));
    return offers.map((j) => ({ ...j }));
  },
  async acceptJob(jobId) {
    await delay(500);
    if (deliveries.some((d) => d.stage !== "delivered")) throw new ApiError("You already have an active delivery", 409);
    const job = need(offers.find((j) => j.id === jobId), "This job was taken by another rider");
    if (+new Date(job.expiresAt) < Date.now()) throw new ApiError("This offer has expired", 410);
    offers = offers.filter((j) => j.id !== jobId);
    const d: Delivery = { ...job, stage: "to_pickup", acceptedAt: iso(now()) };
    deliveries.unshift(d);
    return { ...d };
  },
  async declineJob(jobId) {
    await delay(200);
    offers = offers.filter((j) => j.id !== jobId);
  },
  async getActiveDelivery() {
    await delay(200);
    const d = deliveries.find((x) => x.stage !== "delivered");
    return d ? { ...d } : null;
  },
  async confirmPickup(id, { code, photoUri }) {
    await delay(500);
    const d = need(deliveries.find((x) => x.id === id), "Delivery not found");
    if (d.stage !== "to_pickup") throw new ApiError("Pickup already confirmed", 409);
    if (!photoUri) throw new ApiError("Take a photo of the sealed parcel", 400);
    if (code.trim().toUpperCase() !== (handoffByOrder[d.orderCode] ?? "")) throw new ApiError("That code does not match this order. Check the seal and try again.", 400);
    d.stage = "picked_up";
    return { ...d };
  },
  async startTransit(id) {
    await delay(300);
    const d = need(deliveries.find((x) => x.id === id), "Delivery not found");
    if (d.stage !== "picked_up") throw new ApiError("Confirm pickup first", 409);
    d.stage = "in_transit";
    return { ...d };
  },
  async markArrived(id) {
    await delay(300);
    const d = need(deliveries.find((x) => x.id === id), "Delivery not found");
    if (d.stage !== "in_transit") throw new ApiError("Start the trip first", 409);
    d.stage = "arrived";
    return { ...d };
  },
  async completeDelivery(id, { otp, photoUri }) {
    await delay(600);
    const d = need(deliveries.find((x) => x.id === id), "Delivery not found");
    if (d.stage !== "arrived") throw new ApiError("Mark arrival first", 409);
    if (!photoUri) throw new ApiError("Take a handover photo", 400);
    if (otp !== deliveryPins[d.orderCode]) throw new ApiError("Wrong code. Ask the customer to check their GEKEL app.", 400);
    d.stage = "delivered";
    d.deliveredAt = iso(now());
    return { ...d };
  },
  async listDeliveries() {
    await delay(250);
    return deliveries.map((d) => ({ ...d }));
  },
  async getEarnings(): Promise<Earnings> {
    await delay(250);
    const done = deliveries.filter((d) => d.stage === "delivered");
    const recent = [
      ...done.map((d) => ({ id: d.id, orderCode: d.orderCode, area: d.dropoff.area, amount: d.payout, tip: d.tip ?? 0, at: d.deliveredAt! })),
      ...completedHistory,
    ];
    const todayTotal = recent.reduce((a, r) => a + r.amount + r.tip, 0);
    return {
      todayTotal,
      todayTrips: recent.length,
      todayDistanceKm: 10.2 + done.reduce((a, d) => a + d.distanceKm, 0),
      weekTotal: 14200 + todayTotal,
      weekTrips: 46 + recent.length,
      recent,
    };
  },
};

export const MOCK_HINTS = { otp: DEMO_OTP, deliveryPin: DELIVERY_PIN, sealCodes: ["SEC-9980-NBO", "GK-10441-ABC"] };

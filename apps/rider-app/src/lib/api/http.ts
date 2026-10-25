/**
 * Real backend client. Every method maps to one REST route so the Go API can be
 * built against this file as its contract. Base URL: EXPO_PUBLIC_API_URL.
 * Photos are sent as multipart (field "photo"); everything else is JSON.
 */
import { Api, ApiError } from "./types";

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;
export const setToken = (t: string | null) => {
  token = t;
};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

const base = () => (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function parse(res: Response) {
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(body?.error ?? body?.message ?? `Something went wrong (${res.status})`, res.status);
  }
  return body;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0);
  }
  return parse(res);
}

async function upload<T>(path: string, fields: Record<string, string | undefined>, photoUri: string, method = "POST"): Promise<T> {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => v !== undefined && form.append(k, v));
  const name = photoUri.split("/").pop() ?? "photo.jpg";
  // React Native's FormData accepts { uri, name, type } for files.
  form.append("photo", { uri: photoUri, name, type: "image/jpeg" } as any);
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: form });
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0);
  }
  return parse(res);
}

const q = encodeURIComponent;

export const httpApi: Api = {
  requestOtp: (phone) => request("POST", "/auth/otp/request", { phone }),
  verifyOtp: (phone, code) => request("POST", "/auth/otp/verify", { phone, code, role: "rider" }),
  me: () => request("GET", "/me"),
  registerPushToken: (t) => request("POST", "/me/push-token", { token: t }),

  getRiderProfile: () => request("GET", "/rider/profile"),
  setOnline: (online) => request("POST", "/rider/online", { online }),
  sendLocation: (point, deliveryId) => request("POST", "/rider/location", { ...point, deliveryId }),
  listOffers: () => request("GET", "/rider/offers"),
  acceptJob: (id) => request("POST", `/rider/offers/${q(id)}/accept`),
  declineJob: (id) => request("POST", `/rider/offers/${q(id)}/decline`),
  getActiveDelivery: () => request("GET", "/rider/deliveries/active"),
  confirmPickup: (id, p) => upload(`/rider/deliveries/${q(id)}/pickup`, { code: p.code }, p.photoUri),
  startTransit: (id) => request("POST", `/rider/deliveries/${q(id)}/start`),
  markArrived: (id) => request("POST", `/rider/deliveries/${q(id)}/arrived`),
  completeDelivery: (id, p) => upload(`/rider/deliveries/${q(id)}/complete`, { otp: p.otp }, p.photoUri),
  listDeliveries: () => request("GET", "/rider/deliveries"),
  getEarnings: () => request("GET", "/rider/earnings"),
};

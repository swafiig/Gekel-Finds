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
  verifyOtp: (phone, code) => request("POST", "/auth/otp/verify", { phone, code, role: "supplier" }),
  me: () => request("GET", "/me"),
  registerPushToken: (t) => request("POST", "/me/push-token", { token: t }),

  getSupplierProfile: () => request("GET", "/supplier/profile"),
  updateSupplierProfile: (p) => request("PATCH", "/supplier/profile", p),
  getSupplierSummary: () => request("GET", "/supplier/summary"),
  listRfqs: () => request("GET", "/supplier/rfqs"),
  getRfq: (id) => request("GET", `/supplier/rfqs/${q(id)}`),
  submitQuote: (id, quote) => request("POST", `/supplier/rfqs/${q(id)}/quote`, quote),
  declineRfq: (id, reason) => request("POST", `/supplier/rfqs/${q(id)}/decline`, { reason }),
  listProducts: () => request("GET", "/supplier/products"),
  saveProduct: async (id, input) => {
    const { photoUri, ...rest } = input;
    const fields = { data: JSON.stringify(rest) };
    // A local file:// uri means a new photo was picked; a remote url means unchanged.
    if (photoUri && !/^https?:/.test(photoUri)) return upload(id ? `/supplier/products/${q(id)}` : "/supplier/products", fields, photoUri, id ? "PUT" : "POST");
    return request(id ? "PUT" : "POST", id ? `/supplier/products/${q(id)}` : "/supplier/products", input);
  },
  setProductStock: (id, stock) => request("PATCH", `/supplier/products/${q(id)}/stock`, { stock }),
  deleteProduct: (id) => request("DELETE", `/supplier/products/${q(id)}`),
  listOrders: () => request("GET", "/supplier/orders"),
  getOrder: (id) => request("GET", `/supplier/orders/${q(id)}`),
  confirmPayment: (id, receivedAmount) => request("POST", `/supplier/orders/${q(id)}/payment/confirm`, { receivedAmount }),
  disputePayment: (id, reason) => request("POST", `/supplier/orders/${q(id)}/payment/dispute`, { reason }),
  submitPackProof: (id, p) => upload(`/supplier/orders/${q(id)}/pack`, { sealSerial: p.sealSerial }, p.photoUri),
  markReady: (id) => request("POST", `/supplier/orders/${q(id)}/ready`),
  listThreads: () => request("GET", "/chat/threads"),
  listMessages: (id) => request("GET", `/chat/threads/${q(id)}/messages`),
  sendMessage: (id, text) => request("POST", `/chat/threads/${q(id)}/messages`, { text }),
  markThreadRead: (id) => request("POST", `/chat/threads/${q(id)}/read`),
};

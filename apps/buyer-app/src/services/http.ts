import { Platform } from 'react-native';
import { API_BASE, API_PREFIX, REQUEST_TIMEOUT_MS } from '../config';
import { tokenStore } from './tokenStore';

/* ───────────── Errors ───────────── */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
    public retryAfter?: number, // seconds, from Retry-After on 429
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  get isNetwork() { return this.status === 0; }
}

/* ───────────── Session state (module-level, one per app) ───────────── */

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;
let isOffline = false;
type RefreshResult = 'ok' | 'expired' | 'unavailable';
let refreshing: Promise<RefreshResult> | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };
export const setSessionExpiredHandler = (fn: (() => void) | null) => { onSessionExpired = fn; };

/** Set by OfflineContext whenever connectivity changes, so requests can fail fast instead of waiting out the timeout. */
export const setOfflineFlag = (v: boolean) => { isOffline = v; };

const CLIENT = `gekel-app (${Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'} ${Platform.Version ?? ''})`.trim();

/* ───────────── Types shared with the server ───────────── */

export interface ApiUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  role: 'buyer' | 'supplier' | 'rider' | 'staff' | 'admin' | 'super_admin';
  is_active: boolean;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  created_at: string;
  last_login_at: string | null;
}
export interface TokenPair { access_token: string; refresh_token: string; token_type: 'Bearer'; expires_in: number }
export interface AuthResponse { user: ApiUser; tokens: TokenPair }

/* ───────────── Core request ───────────── */

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Send the access token and auto-refresh on 401. Default true. */
  auth?: boolean;
}

async function rawFetch(path: string, opts: Options, token: string | null): Promise<Response> {
  if (isOffline) throw new ApiError(0, 'network', 'Could not reach the server');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${API_PREFIX}${path}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers: {
        Accept: 'application/json',
        'X-Client': CLIENT,
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e: any) {
    const timedOut = e?.name === 'AbortError';
    throw new ApiError(0, timedOut ? 'timeout' : 'network', timedOut ? 'The request timed out' : 'Could not reach the server');
  } finally {
    clearTimeout(timer);
  }
}

async function toError(res: Response): Promise<ApiError> {
  let body: any = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  const e = body?.error;
  const retry = Number(res.headers.get('Retry-After'));
  return new ApiError(
    res.status,
    e?.code ?? `http_${res.status}`,
    e?.message ?? 'Something went wrong. Please try again.',
    e?.fields,
    Number.isFinite(retry) && retry > 0 ? retry : undefined,
    e?.request_id,
  );
}

export async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const auth = opts.auth !== false;
  const sentWith = auth ? accessToken : null;
  let res = await rawFetch(path, opts, sentWith);

  if (res.status === 401 && auth) {
    if (accessToken && accessToken !== sentWith) {
      // Another request already refreshed while ours was in flight: just replay with the new token.
      res = await rawFetch(path, opts, accessToken);
    } else {
      // Access token expired or revoked: one silent refresh (shared by all callers), then replay.
      const r = await refreshTokens();
      if (r === 'ok') res = await rawFetch(path, opts, accessToken);
      else if (r === 'expired') throw new ApiError(401, 'session_expired', 'Your session has expired. Please sign in again.');
      else throw new ApiError(0, 'network', 'Could not reach the server');
    }
  }
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ───────────── Refresh (single-flight) ───────────── */

/**
 * Many requests can hit 401 at the same moment. They must share ONE refresh call,
 * because refresh tokens are single-use: a second parallel refresh with the same token
 * would look like token theft to the server and sign everyone out.
 */
export function refreshTokens(): Promise<RefreshResult> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => { refreshing = null; });
  }
  return refreshing;
}

async function doRefresh(): Promise<RefreshResult> {
  const rt = await tokenStore.getRefresh();
  if (!rt) { expire(); return 'expired'; }
  try {
    const res = await rawFetch('/auth/refresh', { method: 'POST', body: { refresh_token: rt } }, null);
    if (res.ok) {
      const data = (await res.json()) as AuthResponse;
      await tokenStore.setRefresh(data.tokens.refresh_token); // persist the NEW token before using it
      setAccessToken(data.tokens.access_token);
      return 'ok';
    }
    if (res.status === 401 || res.status === 403) { expire(); return 'expired'; } // dead for good
    return 'unavailable'; // 5xx / rate limit: keep tokens, let the caller retry later
  } catch {
    return 'unavailable'; // offline: keep tokens
  }
}

function expire() {
  setAccessToken(null);
  void tokenStore.clear();
  onSessionExpired?.();
}

/** Used at app start: restore the session from the stored refresh token. */
export async function restoreSession(): Promise<AuthResponse | null> {
  const rt = await tokenStore.getRefresh();
  if (!rt) return null;
  const res = await rawFetch('/auth/refresh', { method: 'POST', body: { refresh_token: rt } }, null);
  if (res.ok) {
    const data = (await res.json()) as AuthResponse;
    await tokenStore.setRefresh(data.tokens.refresh_token);
    setAccessToken(data.tokens.access_token);
    return data;
  }
  if (res.status === 401 || res.status === 403) { await tokenStore.clear(); return null; }
  throw await toError(res); // server trouble: do not log the user out for that
}

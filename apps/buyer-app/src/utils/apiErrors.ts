import { ApiError } from '../services/http';

/** "14 minutes", "45 seconds" */
export const formatWait = (seconds: number) => {
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} hour${seconds > 3600 ? 's' : ''}`;
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} minute${seconds > 60 ? 's' : ''}`;
  return `${Math.max(1, Math.ceil(seconds))} seconds`;
};

/** One place that turns server/network errors into messages a person can act on. */
export function friendlyError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(e instanceof ApiError)) return fallback;
  if (e.status === 0) return e.code === 'timeout' ? 'The connection is slow. Check your internet and try again.' : 'No internet connection. Check your data or Wi-Fi and try again.';
  if (e.status === 429) {
    const when = e.retryAfter ? ` Try again in ${formatWait(e.retryAfter)}.` : '';
    if (e.code === 'account_locked') return `Too many failed sign-in attempts.${when} You can also reset your password.`;
    if (e.code === 'otp_cooldown') return `A code was just sent.${when}`;
    return `Too many attempts.${when}`;
  }
  if (e.status >= 500) return 'Our servers are having a moment. Please try again shortly.';
  return e.message || fallback;
}

/** Server field errors (validation_failed) mapped to the field names the screens use. */
export function fieldErrors(e: unknown, map: Record<string, string> = {}): Record<string, string> {
  if (!(e instanceof ApiError) || !e.fields) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e.fields)) out[map[k] ?? k] = v;
  return out;
}

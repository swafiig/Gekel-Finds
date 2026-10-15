import { ApiError, ApiUser, AuthResponse, request, restoreSession, setAccessToken } from './http';
import { tokenStore } from './tokenStore';

/** The shape the rest of the app uses (kept compatible with the screens you already have). */
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: ApiUser['role'];
  emailVerified: boolean;
  phoneVerified: boolean;
}

export const toUser = (u: ApiUser): User => ({
  id: u.id,
  name: u.full_name,
  phone: u.phone,
  email: u.email ?? undefined,
  role: u.role,
  emailVerified: !!u.email_verified_at,
  phoneVerified: !!u.phone_verified_at,
});

export interface SessionInfo {
  id: string; device_name: string; user_agent: string; ip_address: string;
  created_at: string; last_used_at: string; expires_at: string; current: boolean;
}

/** Store the tokens from login/register, and hand back the app-level user. */
async function persist(r: AuthResponse): Promise<User> {
  await tokenStore.setRefresh(r.tokens.refresh_token);
  setAccessToken(r.tokens.access_token);
  return toUser(r.user);
}

export const authApi = {
// Every account made in this app is a buyer. Suppliers, riders and staff are created elsewhere and use their own apps.
  async register(input: { name: string; phone: string; email?: string; password: string }): Promise<User> {
    const r = await request<AuthResponse>('/auth/register', {
      auth: false,
      body: { full_name: input.name, phone: input.phone, email: input.email || undefined, password: input.password },
    });
    return persist(r);
  },

  async login(identifier: string, password: string): Promise<User> {
    const r = await request<AuthResponse>('/auth/login', { auth: false, body: { identifier, password } });
    return persist(r);
  },

  /** Restore a session at app start. Returns null when there is no valid stored session. */
  async restore(): Promise<User | null> {
    const r = await restoreSession();
    return r ? toUser(r.user) : null;
  },

  async me(): Promise<User> {
    return toUser(await request<ApiUser>('/auth/me'));
  },

  async logout(): Promise<void> {
    const refresh = await tokenStore.getRefresh();
    try {
      await request<void>('/auth/logout', { method: 'POST', body: refresh ? { refresh_token: refresh } : undefined });
    } catch {
      /* offline or already expired: we still clear the device below */
    }
    setAccessToken(null);
    await tokenStore.clear();
  },

  async logoutAll(): Promise<void> {
    await request<void>('/auth/logout-all', { method: 'POST' });
    setAccessToken(null);
    await tokenStore.clear();
  },

  /** (Re)send the phone verification code. A code is already sent automatically at registration. */
  sendPhoneCode: () => request<{ message: string; resend_after_seconds: number }>('/auth/phone/send-code', { method: 'POST' }),

  async verifyPhone(code: string): Promise<User> {
    return toUser(await request<ApiUser>('/auth/phone/verify', { body: { code } }));
  },

  forgotPassword: (identifier: string) =>
    request<{ message: string; resend_after_seconds: number }>('/auth/forgot-password', { auth: false, body: { identifier } }),

  verifyOtp: (identifier: string, code: string) =>
    request<{ reset_token: string; expires_in: number }>('/auth/verify-otp', { auth: false, body: { identifier, code } }),

  resetPassword: (resetToken: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', { auth: false, body: { reset_token: resetToken, new_password: newPassword } }),

  changePassword: (current: string, next: string) =>
    request<void>('/auth/change-password', { method: 'POST', body: { current_password: current, new_password: next } }),

  async sessions(): Promise<SessionInfo[]> {
    return (await request<{ sessions: SessionInfo[] }>('/auth/sessions')).sessions;
  },
  revokeSession: (id: string) => request<void>('/auth/sessions/' + encodeURIComponent(id), { method: 'DELETE' }),
};

export { ApiError };

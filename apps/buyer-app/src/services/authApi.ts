/**
 * MOCK AUTH API — replace each function body with a real fetch/axios call
 * when the backend is ready. Keep the signatures and the rest of the app
 * will keep working.
 */
export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

const wait = (ms = 900) => new Promise<void>((r) => setTimeout(r, ms));

export const authApi = {
  // POST /auth/login
  async login(identifier: string, _password: string): Promise<AuthResult> {
    await wait();
    const isMail = identifier.includes('@');
    return {
      token: 'mock-token',
      user: {
        id: '1',
        name: 'Kelvin',
        email: isMail ? identifier : undefined,
        phone: isMail ? undefined : identifier,
      },
    };
  },

  // POST /auth/register
  async register(input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }): Promise<AuthResult> {
    await wait(1100);
    return { token: 'mock-token', user: { id: '1', name: input.name, phone: input.phone, email: input.email } };
  },

  // POST /auth/forgot-password  (sends OTP via SMS / email)
  async requestPasswordReset(_identifier: string): Promise<void> {
    await wait();
  },

  // POST /auth/verify-otp   (mock accepts 123456)
  async verifyOtp(_identifier: string, code: string): Promise<void> {
    await wait(700);
    if (code !== '123456') throw new Error('That code is incorrect. Check it and try again.');
  },

  // POST /auth/reset-password
  async resetPassword(_identifier: string, _code: string, _password: string): Promise<void> {
    await wait();
  },
};

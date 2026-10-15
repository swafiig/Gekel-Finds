import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User } from '../services/authApi';
import { usersApi } from '../services/usersApi';
import { ApiError, setAccessToken, setSessionExpiredHandler } from '../services/http';

type Status = 'loading' | 'onboarding' | 'signedOut' | 'signedIn';
interface RegisterInput { name: string; phone: string; email?: string; password: string }

interface AuthContextValue {
  status: Status;
  user: User | null;
  /** Shown once on the login screen after a forced sign-out (e.g. "Your session expired"). */
  notice: string | null;
  clearNotice: () => void;
  /** True right after signup so the app can open the phone-verification screen once. */
  justRegistered: boolean;
  clearJustRegistered: () => void;
  completeOnboarding: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: { name?: string; email?: string }) => Promise<void>;
}

const ONBOARDED_KEY = 'gekel.onboarded';
const MIN_SPLASH_MS = 2200;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  const signOutLocally = useCallback((message?: string) => {
    setAccessToken(null);
    setUser(null);
    setStatus('signedOut');
    if (message) setNotice(message);
  }, []);

  // The HTTP layer calls this when a refresh token is rejected (expired, revoked, or reuse detected).
  useEffect(() => {
    setSessionExpiredHandler(() => signOutLocally('Your session has expired. Please sign in again.'));
    return () => setSessionExpiredHandler(null);
  }, [signOutLocally]);

  // Restore the session at launch. The splash stays up for at least MIN_SPLASH_MS.
  useEffect(() => {
    (async () => {
      const wait = new Promise((r) => setTimeout(r, MIN_SPLASH_MS));
      const onboarded = (await AsyncStorage.getItem(ONBOARDED_KEY)) === '1';
      let restored: User | null = null;
      let serverDown = false;
      try {
        restored = await authApi.restore();
      } catch (e) {
        serverDown = e instanceof ApiError; // offline or server trouble: tokens are kept for next launch
      }
      await wait;
      if (restored) { setUser(restored); setStatus('signedIn'); }
      else {
        setStatus(onboarded ? 'signedOut' : 'onboarding');
        if (serverDown) setNotice('We could not reach the server. Check your connection and sign in again.');
      }
    })();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    setStatus('signedOut');
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const u = await authApi.login(identifier, password); // throws ApiError for the screen to display
    setUser(u); setNotice(null); setStatus('signedIn');
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const u = await authApi.register(input);
    setUser(u); setNotice(null); setJustRegistered(true); setStatus('signedIn');
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout(); // revokes on the server (best effort) and clears the device
    signOutLocally();
  }, [signOutLocally]);

  const logoutAll = useCallback(async () => {
    await authApi.logoutAll();
    signOutLocally();
  }, [signOutLocally]);

  const refreshUser = useCallback(async () => { setUser(await usersApi.getMe()); }, []);

  const updateProfile = useCallback(async (patch: { name?: string; email?: string }) => {
    setUser(await usersApi.updateMe(patch));
  }, []);

  const value = useMemo(
    () => ({ status, user, notice, clearNotice: () => setNotice(null), justRegistered, clearJustRegistered: () => setJustRegistered(false), completeOnboarding, login, register, logout, logoutAll, refreshUser, updateProfile }),
    [status, user, notice, justRegistered, completeOnboarding, login, register, logout, logoutAll, refreshUser, updateProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

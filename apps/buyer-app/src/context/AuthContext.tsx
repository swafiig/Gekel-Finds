import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User } from '../services/authApi';

type Status = 'loading' | 'onboarding' | 'signedOut' | 'signedIn';
export type SignupIntent = 'buyer' | 'supplier';

interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

interface AuthContextValue {
  status: Status;
  user: User | null;
  signupIntent: SignupIntent;
  setSignupIntent: (i: SignupIntent) => void;
  completeOnboarding: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const KEYS = { onboarded: 'gekel.onboarded', token: 'gekel.token', user: 'gekel.user' };
const MIN_SPLASH_MS = 2200;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [signupIntent, setSignupIntent] = useState<SignupIntent>('buyer');

  // Bootstrap: read persisted session, but never show the splash for less than MIN_SPLASH_MS
  useEffect(() => {
    (async () => {
      const [stored] = await Promise.all([
        AsyncStorage.multiGet([KEYS.onboarded, KEYS.token, KEYS.user]),
        new Promise((r) => setTimeout(r, MIN_SPLASH_MS)),
      ]);
      const map = Object.fromEntries(stored);
      if (map[KEYS.token] && map[KEYS.user]) {
        // TODO: validate / refresh the token with the backend here
        setUser(JSON.parse(map[KEYS.user] as string));
        setStatus('signedIn');
      } else {
        setStatus(map[KEYS.onboarded] ? 'signedOut' : 'onboarding');
      }
    })();
  }, []);

  const persistSession = async (token: string, u: User) => {
    // TODO: use expo-secure-store for the token in production
    await AsyncStorage.multiSet([
      [KEYS.token, token],
      [KEYS.user, JSON.stringify(u)],
    ]);
    setUser(u);
    setStatus('signedIn');
  };

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(KEYS.onboarded, '1');
    setStatus('signedOut');
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const { token, user: u } = await authApi.login(identifier, password);
    await persistSession(token, u);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { token, user: u } = await authApi.register(input);
    await persistSession(token, u);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([KEYS.token, KEYS.user]);
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, user, signupIntent, setSignupIntent, completeOnboarding, login, register, logout }),
    [status, user, signupIntent, completeOnboarding, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

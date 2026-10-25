import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { api, Session, setToken, setUnauthorizedHandler, User } from "../lib/api";

const KEY = "gekel.session";

interface AuthState {
  ready: boolean;
  user: User | null;
  restore: () => Promise<void>;
  signIn: (s: Session) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  ready: false,
  user: null,

  restore: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) {
        const s: Session = JSON.parse(raw);
        if (s.user.role === "supplier") {
          setToken(s.token);
          try {
            const fresh = await api.me();
            set({ user: fresh });
          } catch (e: any) {
            // Offline at launch: trust the stored session. Reject only an explicit 401.
            if (e?.status === 401) {
              setToken(null);
              await SecureStore.deleteItemAsync(KEY);
            } else {
              set({ user: s.user });
            }
          }
        }
      }
    } catch {
      /* corrupt or unavailable storage: fall through to signed-out */
    }
    setUnauthorizedHandler(() => void get().signOut());
    set({ ready: true });
  },

  signIn: async (s) => {
    setToken(s.token);
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify(s));
    } catch {
      /* session still works for this run */
    }
    set({ user: s.user });
  },

  signOut: async () => {
    setToken(null);
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch {}
    set({ user: null });
  },
}));

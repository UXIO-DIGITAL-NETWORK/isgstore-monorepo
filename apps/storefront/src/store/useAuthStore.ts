import { create } from "zustand";
import Cookies from "js-cookie";
import type { User, UserRole } from "@/types/models/user.model";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string | null, user: User, remember?: boolean) => void;
  /** Swap in a rotated token pair without disturbing the cached user. */
  setToken: (token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  getRole: () => UserRole | null;
}

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const MAX_EXPIRES_DAY = 30;

const cookieOptions = (expires?: number) => ({
  expires,
  secure: import.meta.env.PROD,
  sameSite: "strict" as const,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  token: Cookies.get(ACCESS_TOKEN_KEY) || null,
  refreshToken: Cookies.get(REFRESH_TOKEN_KEY) || null,
  user: null,

  setAuth: (token, refreshToken, user, remember = false) => {
    Cookies.set(ACCESS_TOKEN_KEY, token, cookieOptions(remember ? MAX_EXPIRES_DAY : undefined));

    if (refreshToken) {
      // The refresh token always gets a persistent cookie, "remember me" or
      // not: it is what lets the 30-day server-side token survive a browser
      // restart, which is the whole point of issuing one.
      Cookies.set(REFRESH_TOKEN_KEY, refreshToken, cookieOptions(MAX_EXPIRES_DAY));
    }

    set((state) => ({ token, refreshToken: refreshToken ?? state.refreshToken, user }));
  },

  setToken: (token, refreshToken) => {
    const remembered = Cookies.get(REFRESH_TOKEN_KEY) ? MAX_EXPIRES_DAY : undefined;
    Cookies.set(ACCESS_TOKEN_KEY, token, cookieOptions(remembered));

    if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_KEY, refreshToken, cookieOptions(MAX_EXPIRES_DAY));
    }

    set((state) => ({ token, refreshToken: refreshToken ?? state.refreshToken }));
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    set({ token: null, refreshToken: null, user: null });
  },

  getRole: () => get().user?.role ?? null,
}));

import { create } from "zustand";
import Cookies from "js-cookie";
import type { User } from "@/models/user.model";
import { permissionsForRole } from "@/constants/roles";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  permissions: string[];
  setAuth: (data: { user: User; access_token: string; refresh_token: string }, remember?: boolean) => void;
  setToken: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
}

const MAX_EXPIRES_DAY: number = 30;

const cookieOptions = (remember: boolean) => ({
  expires: remember ? MAX_EXPIRES_DAY : undefined,
  secure: import.meta.env.PROD,
  sameSite: "strict" as const,
});

// Permissions are derived from the role NAME (see @/constants/roles) — the two
// payment-page roles are "payment-internal" (kita) and "payment-admin" (client).

// js-cookie cannot read a cookie's expiry back, so the "remember me" choice is
// persisted alongside the session. Without it a token refresh would have to
// guess the lifetime and would silently up- or down-grade the session.
const readRememberCookie = (): boolean => Cookies.get("auth_remember") === "1";

const readUserCookie = (): User | null => {
  const raw = Cookies.get("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const initialUser = readUserCookie();

export const useAuthStore = create<AuthState>((set) => ({
  token: Cookies.get("access_token") || null,
  refreshToken: Cookies.get("refresh_token") || null,
  user: initialUser,
  permissions: permissionsForRole(initialUser?.role),

  setAuth: ({ user, access_token, refresh_token }, remember = false) => {
    const options = cookieOptions(remember);
    Cookies.set("access_token", access_token, options);
    Cookies.set("refresh_token", refresh_token, options);
    Cookies.set("auth_user", JSON.stringify(user), options);
    Cookies.set("auth_remember", remember ? "1" : "0", options);
    set({
      token: access_token,
      refreshToken: refresh_token,
      user,
      permissions: permissionsForRole(user.role),
    });
  },

  /**
   * Rotate the token pair after a refresh, leaving `user`/`permissions` alone.
   *
   * The cookies are rewritten with the lifetime the session was created with
   * (read back from `auth_remember`), so a refresh never silently promotes a
   * session-only login into a 30-day one, nor demotes a remembered one.
   */
  setToken: (accessToken, refreshToken) => {
    const options = cookieOptions(readRememberCookie());

    Cookies.set("access_token", accessToken, options);
    if (refreshToken) Cookies.set("refresh_token", refreshToken, options);

    set((state) => ({
      token: accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
    }));
  },

  clearAuth: () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("auth_user");
    Cookies.remove("auth_remember");
    set({ token: null, refreshToken: null, user: null, permissions: [] });
  },
}));

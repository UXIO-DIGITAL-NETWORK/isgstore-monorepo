import { create } from "zustand";
import Cookies from "js-cookie";
import type { User } from "@/models/user.model";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  permissions: string[];
  setAuth: (data: { user: User; access_token: string; refresh_token: string }, remember?: boolean) => void;
  setToken: (accessToken: string, refreshToken?: string) => void;
  patchUser: (patch: Partial<User>) => void;
  clearAuth: () => void;
}

const MAX_EXPIRES_DAY: number = 30;

const cookieOptions = (remember: boolean) => ({
  expires: remember ? MAX_EXPIRES_DAY : undefined,
  secure: import.meta.env.PROD,
  sameSite: "strict" as const,
});

// ponytail: stopgap map pending a backend-confirmed role→permission scheme
// (system_architecture.md §5). Only role_id 1 (super-admin) is confirmed to
// exist; any other role_id is unmapped → no permissions, don't guess.
const permissionsForRole = (roleId: number): string[] => (roleId === 1 ? ["*"] : []);

// js-cookie cannot read a cookie's expiry back, so the "remember me" choice is
// persisted alongside the session. Without it a token refresh would have to
// guess the lifetime and would silently up- or down-grade the session.
const readRememberCookie = (): boolean => Cookies.get("auth_remember") === "1";

/**
 * The "remember me" choice this session was created with.
 *
 * Exported for the callers that re-issue a session mid-flight — enrolling or
 * moving an authenticator revokes every token and hands back a new pair, and
 * `setAuth` defaults `remember` to false. Passing this keeps a remembered
 * login remembered instead of silently demoting it to a session-only one.
 */
export const readRememberChoice = readRememberCookie;

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
  // No user cookie (guest, or a legacy token-only session from before the
  // user was persisted): keep the wildcard default. Guests never reach
  // requirePermission (requireAuth on the _protected layout redirects first),
  // and legacy sessions must not get bounced off gated routes mid-session.
  permissions: initialUser ? permissionsForRole(initialUser.role_id) : ["*"],

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
      permissions: permissionsForRole(user.role_id),
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

  /**
   * Merge a partial update into the signed-in user.
   *
   * The cookie write is not optional: `user` is rehydrated from `auth_user` on
   * every full page load, so skipping it would revert the change on refresh —
   * and for the timezone sync that means the PATCH re-fires forever.
   */
  patchUser: (patch) =>
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...patch };
      Cookies.set("auth_user", JSON.stringify(user), cookieOptions(readRememberCookie()));
      return { user, permissions: permissionsForRole(user.role_id) };
    }),

  clearAuth: () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("auth_user");
    Cookies.remove("auth_remember");
    set({ token: null, refreshToken: null, user: null, permissions: [] });
  },
}));

import { create } from "zustand";
import Cookies from "js-cookie";
import type { User } from "@/models/user.model";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  permissions: string[];
  setAuth: (data: { user: User; access_token: string; refresh_token: string }, remember?: boolean) => void;
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
    set({
      token: access_token,
      refreshToken: refresh_token,
      user,
      permissions: permissionsForRole(user.role_id),
    });
  },

  clearAuth: () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("auth_user");
    set({ token: null, refreshToken: null, user: null, permissions: [] });
  },
}));

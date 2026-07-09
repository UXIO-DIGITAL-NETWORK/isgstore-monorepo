import { create } from "zustand";
import Cookies from "js-cookie";

interface AuthState {
  token: string | null;
  // MVP ships a single super-admin role with all permissions (wildcard) —
  // see system_architecture.md §5. Defaulted (not yet hydrated from a real
  // /me response, since the backend doesn't exist) so <Can>/useCan and
  // requirePermission have something to gate against today.
  roles: string[];
  permissions: string[];
  setToken: (token: string, remember?: boolean) => void;
  clearAuth: () => void;
}

const MAX_EXPIRES_DAY: number = 30;

export const useAuthStore = create<AuthState>((set) => ({
  token: Cookies.get("access_token") || null,
  roles: ["super-admin"],
  permissions: ["*"],

  setToken: (token, remember = false) => {
    Cookies.set("access_token", token, {
      expires: remember ? MAX_EXPIRES_DAY : undefined,
      secure: import.meta.env.PROD,
      sameSite: "strict",
    });
    set({ token });
  },

  clearAuth: () => {
    Cookies.remove("access_token");
    set({ token: null });
  },
}));

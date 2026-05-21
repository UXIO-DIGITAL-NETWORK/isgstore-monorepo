import { create } from "zustand";
import Cookies from "js-cookie";
import type { User } from "@/types/models/user.model";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User, remember?: boolean) => void;
  clearAuth: () => void;
  getRole: () => User["role"] | null;
}

const MAX_EXPIRES_DAY = 30;

export const useAuthStore = create<AuthState>((set, get) => ({
  token: Cookies.get("access_token") || null,
  user: null,

  setAuth: (token, user, remember = false) => {
    Cookies.set("access_token", token, {
      expires: remember ? MAX_EXPIRES_DAY : undefined,
      secure: import.meta.env.PROD,
      sameSite: "strict",
    });
    set({ token, user });
  },

  clearAuth: () => {
    Cookies.remove("access_token");
    set({ token: null, user: null });
  },

  getRole: () => get().user?.role ?? null,
}));

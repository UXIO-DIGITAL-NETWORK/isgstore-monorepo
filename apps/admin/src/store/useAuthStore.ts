import { create } from "zustand";
import Cookies from "js-cookie";

interface AuthState {
  token: string | null;
  setToken: (token: string, remember?: boolean) => void;
  clearAuth: () => void;
}

const MAX_EXPIRES_DAY: number = 30;

export const useAuthStore = create<AuthState>((set) => ({
  token: Cookies.get("access_token") || null,

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

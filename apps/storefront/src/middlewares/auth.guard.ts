import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

type RequireAuthOptions = {
  role: "member" | "superadmin";
  locale: string;
};

type RequireGuestOptions = {
  locale: string;
};

export const requireAuth = ({ role, locale }: RequireAuthOptions) => {
  const { token, user } = useAuthStore.getState();
  if (!token || !user) {
    throw redirect({ to: "/$locale/login", params: { locale } });
  }
  if (user.role !== role) {
    throw redirect({ to: "/$locale", params: { locale } });
  }
};

export const requireGuest = ({ locale }: RequireGuestOptions) => {
  const { token } = useAuthStore.getState();
  if (token) {
    throw redirect({ to: "/$locale", params: { locale } });
  }
};

export const requireRole = (role: "member" | "superadmin") => {
  const { user } = useAuthStore.getState();
  if (!user || user.role !== role) {
    throw redirect({ to: "/$locale", params: { locale: "id" } });
  }
};

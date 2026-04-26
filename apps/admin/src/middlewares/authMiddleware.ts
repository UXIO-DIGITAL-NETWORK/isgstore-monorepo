import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

// Middleware for route that requires authentication
export const requireAuth = () => {
  const { token } = useAuthStore.getState();
  if (!token) {
    throw redirect({ to: "/login" });
  }
};

// Middleware for route that requires guest
export const requireGuest = () => {
  const { token } = useAuthStore.getState();
  if (token) {
    throw redirect({ to: "/dashboard" });
  }
};

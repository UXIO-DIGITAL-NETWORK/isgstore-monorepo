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
    throw redirect({ to: "/admin/dashboard" });
  }
};

// Middleware for route that requires a specific permission (resource.action).
// Wildcard ("*", held by super-admin) grants everything — see
// system_architecture.md §5.
export const requirePermission = (permission: string) => {
  const { permissions } = useAuthStore.getState();
  const allowed = permissions.includes("*") || permissions.includes(permission);
  if (!allowed) {
    throw redirect({ to: "/admin/dashboard" });
  }
};

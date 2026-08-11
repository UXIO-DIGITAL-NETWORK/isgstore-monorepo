import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

// The post-auth landing. Both roles share the same protected shell; the shell
// renders role-appropriate navigation and each route guards on its permission.
const HOME = "/app/dashboard" as const;

/** Requires an authenticated session. */
export const requireAuth = () => {
  const { token } = useAuthStore.getState();
  if (!token) {
    throw redirect({ to: "/login" });
  }
};

/** Guest-only (login). Already-authenticated users are sent to the shell. */
export const requireGuest = () => {
  const { token } = useAuthStore.getState();
  if (token) {
    throw redirect({ to: HOME });
  }
};

/**
 * Gate a route on a coarse permission (see @/constants/roles). Used in
 * `beforeLoad` so a merchant can never load a finance route and vice-versa.
 */
export const requirePermission = (permission: string) => {
  const { permissions } = useAuthStore.getState();
  if (!permissions.includes(permission)) {
    throw redirect({ to: HOME });
  }
};

export const requireFinance = () => requirePermission("finance");
export const requireMerchant = () => requirePermission("merchant");

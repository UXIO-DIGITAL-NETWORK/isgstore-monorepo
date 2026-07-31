import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/features/auth/services/auth.service";
import type { UserRole } from "@/types/models/user.model";

/**
 * Roles that satisfy a `member` guard.
 *
 * The tier ladder is additive: a VIP or reseller is still a customer and must
 * reach the member dashboard. Only `admin` is a different audience.
 */
const MEMBER_ROLES: readonly UserRole[] = ["member", "vip", "reseller", "agent"] as const;

type RequireAuthOptions = {
  role?: "member" | "admin";
  locale: string;
};

type RequireGuestOptions = {
  locale: string;
};

/**
 * Single in-flight `/me` call.
 *
 * Only the token survives a page reload — the user object does not — so on the
 * first guarded navigation after a refresh the store has a token but no user.
 * Without this the guard would read `user === null` and log a perfectly valid
 * session out. Shared so sibling guarded routes don't each fire their own.
 */
let hydration: Promise<void> | null = null;

async function hydrateUser(): Promise<void> {
  hydration ??= (async () => {
    try {
      const response = await authService.me();
      useAuthStore.getState().setUser(response.data);
    } catch {
      // A 401 already cleared the store via the axios interceptor; anything
      // else leaves the session unproven and the guard below redirects.
    } finally {
      hydration = null;
    }
  })();

  return hydration;
}

function satisfies(actual: UserRole | undefined, required: RequireAuthOptions["role"]): boolean {
  if (!required) return true;
  if (!actual) return false;

  return required === "admin" ? actual === "admin" : MEMBER_ROLES.includes(actual);
}

export const requireAuth = async ({ role, locale }: RequireAuthOptions) => {
  if (!useAuthStore.getState().token) {
    throw redirect({ to: "/$locale/login", params: { locale } });
  }

  if (!useAuthStore.getState().user) {
    await hydrateUser();
  }

  const { token, user } = useAuthStore.getState();

  if (!token || !user) {
    throw redirect({ to: "/$locale/login", params: { locale } });
  }

  if (!satisfies(user.role, role)) {
    throw redirect({ to: "/$locale", params: { locale } });
  }
};

export const requireGuest = ({ locale }: RequireGuestOptions) => {
  if (useAuthStore.getState().token) {
    throw redirect({ to: "/$locale", params: { locale } });
  }
};

export const requireRole = (role: RequireAuthOptions["role"]) => {
  const { user } = useAuthStore.getState();

  if (!satisfies(user?.role, role)) {
    throw redirect({ to: "/$locale", params: { locale: "id" } });
  }
};

import type { User } from "@/models/user.model";

/**
 * The two payment-page roles. Values match the API's lower-cased role name
 * (App\Enums\RoleType):
 *   - "payment-internal" = kita (internal team: verify withdrawals, set fees,
 *     see every merchant)
 *   - "payment-admin"    = client (merchant: own data, request withdrawals)
 */
export const ROLES = {
  INTERNAL: "payment-internal",
  ADMIN: "payment-admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Permission strings granted per role. Kept coarse for Phase 1. */
export const permissionsForRole = (role: string | undefined): string[] => {
  switch (role) {
    case ROLES.INTERNAL:
      return ["payment-internal"];
    case ROLES.ADMIN:
      return ["payment-admin"];
    default:
      return [];
  }
};

export const roleOf = (user: User | null): string | undefined => user?.role;

export const isPaymentInternal = (user: User | null): boolean => roleOf(user) === ROLES.INTERNAL;
export const isPaymentAdmin = (user: User | null): boolean => roleOf(user) === ROLES.ADMIN;

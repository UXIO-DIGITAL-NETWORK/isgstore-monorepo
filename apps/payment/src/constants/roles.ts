import type { User } from "@/models/user.model";

/**
 * The two payment-page roles. Values match the API's lower-cased role name
 * (App\Enums\RoleType): "finance" = kita (platform operator), "finance-developer"
 * = client (merchant).
 */
export const ROLES = {
  FINANCE: "finance",
  MERCHANT: "finance-developer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Permission strings granted per role. Kept coarse for Phase 1. */
export const permissionsForRole = (role: string | undefined): string[] => {
  switch (role) {
    case ROLES.FINANCE:
      return ["finance"];
    case ROLES.MERCHANT:
      return ["merchant"];
    default:
      return [];
  }
};

export const roleOf = (user: User | null): string | undefined => user?.role;

export const isFinance = (user: User | null): boolean => roleOf(user) === ROLES.FINANCE;
export const isMerchant = (user: User | null): boolean => roleOf(user) === ROLES.MERCHANT;

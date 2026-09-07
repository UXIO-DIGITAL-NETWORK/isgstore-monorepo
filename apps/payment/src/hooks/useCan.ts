import { useAuthStore } from "@/store/useAuthStore";

/**
 * RBAC UI gate (system_architecture.md §5). Only `super-admin` exists in MVP
 * and holds the wildcard permission `"*"`, but every privileged action is
 * gated through this now so future roles (Finance, Content Editor) are a
 * data change, not a UI rewrite. Permission strings are `resource.action`
 * (e.g. "transactions.delete").
 */
export function useCan(permission: string): boolean {
  const permissions = useAuthStore((state) => state.permissions);
  return permissions.includes("*") || permissions.includes(permission);
}

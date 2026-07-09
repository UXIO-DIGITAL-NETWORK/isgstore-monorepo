---
name: rbac-guards
description: Route + UI authorization scaffold (super-admin now, multi-role later) — requirePermission, Can, useCan. Activate when protecting routes or gating actions.
---
# RBAC Guards (scaffold)
Authoritative: `context/system_architecture.md §5`, `rules/rbac-security.md`.
- `useAuthStore` holds `token`, `roles: string[]`, `permissions: string[]` (from login/`me`). Super Admin = `["*"]`.
- **Route:** `requirePermission("resource.action")` in `beforeLoad` (in `src/middlewares/authMiddleware.ts`, alongside `requireAuth`/`requireGuest`); `*` short-circuits.
- **UI:** `<Can permission="transactions.refund">...</Can>` component + `useCan(perm): boolean` hook to gate action buttons/menu items.
- Permission strings = `resource.action` (`transactions.view`, `transactions.refund`, `financial.export`, ...).
- Destructive actions: gate with `<Can>` + confirm dialog + `sonner` toast.
Build the plumbing even though only one role exists — future roles become a data change, not a refactor.

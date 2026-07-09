# Authorization & Security

- Only **`super-admin`** exists in MVP and holds **all permissions** (`["*"]`), but build the RBAC plumbing now so future roles drop in without refactors (`system_architecture.md §5`).
- `useAuthStore` holds `token`, `roles: string[]`, `permissions: string[]` (hydrated from the login/`me` response).
- **Route gate:** `requirePermission("resource.action")` in a route's `beforeLoad` — never inline in a component. `*` short-circuits to allowed.
- **UI gate:** wrap privileged actions in `<Can permission="transactions.refund">` / gate logic with `useCan(perm)`.
- Permission strings are `resource.action` (e.g. `transactions.view`, `transactions.refund`, `financial.export`).
- **Destructive/irreversible actions** (refund, status override) require a confirmation dialog + a `sonner` toast on success/failure.
- Token lives in the `access_token` cookie (`js-cookie`); `secure` in prod, `sameSite: "strict"`. Never read/commit `.env*` (denied in `.claude/settings.json`). Never call the payment/provider layer directly — it is backend-proxied.

**Why this matters here:** even though Super Admin sees everything today, gating actions via `<Can>` from day one is what makes the later Finance / Content-Editor roles a data change, not a UI rewrite. The `requireAuth`/`requireGuest` guards already exist in `src/middlewares/authMiddleware.ts` — `requirePermission` joins them there.

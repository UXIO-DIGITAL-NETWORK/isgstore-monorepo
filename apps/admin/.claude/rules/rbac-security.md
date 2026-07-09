# Authorization & security (always on) — mirrors `.agents/rules/rbac-security`

- Only `super-admin` (= `["*"]`) exists now, but build the scaffold: `useAuthStore` holds `roles`/`permissions`; `requirePermission("resource.action")` in `beforeLoad`; `<Can permission>` / `useCan()` gate UI actions.
- Destructive/irreversible actions (refund, status override) require a confirm dialog + a `sonner` toast on success/failure, and are `<Can>`-gated.
- Token in the `access_token` cookie (`js-cookie`); `secure` in prod, `sameSite: "strict"`. Never call the payment/provider layer directly (backend-proxied). Never `Read`/commit `.env*`.

**Why this matters here:** gating actions via `<Can>` from day one makes the later Finance / Content-Editor roles a data change, not a UI rewrite. `requireAuth`/`requireGuest` already exist in `src/middlewares/authMiddleware.ts`; `requirePermission` joins them there.

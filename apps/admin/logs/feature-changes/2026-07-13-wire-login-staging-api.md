# 2026-07-13 — Wire login to the real staging API

**Scope:** auth (login flow), auth store, axios interceptor, dashboard operator identity
**Type:** feat
**Author/agent:** Claude (main session)

## What changed

- `authService.login` posts to **`/auth/login`** (was `/login`) with the form values **plus an auto-detected IANA timezone** — new `src/utils/getBrowserTimezone.ts` wraps `Intl.DateTimeFormat().resolvedOptions().timeZone`, merged in `useLogin`'s `mutationFn`. Timezone is never a form field; `loginSchema` stays exactly `{ email, password, remember }`.
- Types matched to the confirmed contract: `ApiResponse<T>` gains `code: number`; `User` (`src/models/user.model.ts`) replaced entirely with the real shape (`id`, `role_id`, `name`, `email`, `phone`, `balance`, `point`, `locale`, `timezone`, `email_verified_at`, `created_at`, `updated_at`, plus reserved `two_factor_confirmed_at?`); `AuthResponseData` is now `{ user, access_token, refresh_token }`; new `LoginPayload = LoginFormValues & { timezone: string }`.
- `useAuthStore`: added `refreshToken` and `user` (persisted in `refresh_token` / `auth_user` cookies alongside the unchanged `access_token` cookie, same remember-me expiry semantics), and `permissions` now derived from `user.role_id` via a stopgap map (`1 → ["*"]`, anything else `→ []`). One `setAuth(data, remember)` action replaces `setToken` (removed as dead code once `useLogin` switched); `clearAuth` clears all three cookies. Dead `roles` field removed. Existing `<Can>` / `useCan` / `requirePermission` were already in place and now gate against real login-derived data.
- 401 interceptor's login-path exemption updated to `/auth/login` — a wrong-password 401 on login no longer force-redirects away from the form.
- Dashboard navbar user menu and welcome banner read the real authenticated user from `useAuthStore`; the "Randy Galang" `OPERATOR` fixture, `dashboardService.getOperator`, `useOperator`, and the `Operator` type were **deleted** (their fixture/service tests removed with them — tests of removed code, not loosened tests). Avatar keeps the existing initials-only `AvatarFallback` (no `avatar_url` in the real response).
- `VITE_API_BASE_URL` → `https://api-staging-topup.uxio-dev.web.id/api/v1` (base now includes `/v1`). **Note:** `.env`/`.env.example` edits are permission-blocked for the agent in this repo — the one-line sed was handed to the operator to run manually; everything else in this entry landed.

## Why

- The staging backend now exists and the login contract was confirmed against a real response (context docs corrected 2026-07-11/13); this replaces the speculative mock-shaped assumptions per `system_architecture.md §1.1/§5` and `product_requirements.md §6`.
- **Provisional:** the `role_id → permissions` map is a client-side stopgap until the backend documents a real role→permission scheme; any `role_id ≠ 1` gets no permissions rather than a guess.
- `balance`/`point`/`locale` typed for accuracy only (shared with the consumer platform's user model) — no admin UI built around them.

## Files touched

- `src/types/api.type.ts`, `src/models/user.model.ts`, `src/features/auth/types/auth.type.ts`
- `src/utils/getBrowserTimezone.ts` (new)
- `src/features/auth/services/auth.service.ts`, `src/features/auth/hooks/useLogin.ts`
- `src/store/useAuthStore.ts`, `src/lib/axios.ts`
- `src/features/dashboard/`: `components/DashboardNavbar.tsx`, `pages/DashboardPage.tsx`, `hooks/useDashboard.ts`, `services/dashboard.service.ts`, `types/dashboard.type.ts`; deleted `data/operator.data.ts`
- Tests — new: `src/features/auth/tests/auth.service.test.ts`, `src/features/auth/tests/useLogin.test.tsx`, `src/lib/axios.test.ts`, `src/features/dashboard/tests/DashboardNavbar.test.tsx`; updated: `DashboardPage.test.tsx`, `dashboard.data.test.ts`, `dashboard.service.test.ts`, `src/test/test-utils.tsx` (adds shared `makeUser`)
- `.env` / `.env.example` (operator-applied, see above)

## Verification

- [x] Built TDD-first: 6 failing tests written and confirmed red for the right reasons (wrong URL, interceptor clearing on `/auth/login`, missing timezone, undefined tokens, fixture identity rendering), then implemented to green
- [x] `npm run test` passes — 25 files / 132 tests
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (0 errors; the 5 pre-existing TanStack-Table `react-hooks/incompatible-library` warnings are unchanged and unrelated)
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Live staging check: `POST /auth/login` reachable from this environment (no CORS/network issue via curl); a seeded-credentials attempt returned **HTTP 422** `{"message":"These credentials do not match our records.","errors":{"email":[...]}}` — endpoint and error path confirmed live, but a real *successful* login (tokens/user landing in the store in-browser) is unverified pending valid staging credentials
- [ ] Renders in **both** light and dark (no visual/styling change made; navbar renders same markup with a different data source)
- [ ] Reconciled against Figma frame (n/a — no visual change)

## Notes / follow-ups

- **Stopgap:** `role_id → permissions` map pending a backend-confirmed scheme (`system_architecture.md §5` revision note).
- **`refresh_token` is stored but no refresh-on-401 flow exists** — that's a separate, not-yet-specified task.
- **Error contract still provisional:** failed-login handling keeps the existing `ApiError` shape since only the success response was confirmed this round. Observed reality: failed login is **422 (not 401)** and its body is `{ message, errors }` with no `status` field — revisit `ApiError` when the error contract is confirmed.
- `balance`/`point` typed `number` per the confirmed response — verify Laravel doesn't serialize them as decimal strings on the first real successful login.
- Legacy token-only sessions (no `auth_user` cookie yet) default to `["*"]` permissions so existing sessions aren't bounced off gated routes; self-resolves at next login.
- `authService.logout` still posts `/logout` — out of scope here; presumably becomes `/auth/logout` in the logout task.

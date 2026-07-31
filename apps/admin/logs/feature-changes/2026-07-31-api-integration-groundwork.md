# 2026-07-31 — API integration groundwork (versioned paths, token refresh, shared mappers)

**Scope:** cross-cutting data layer (`config/env`, `lib/axios`, `store/useAuthStore`, `features/auth` service)
**Type:** fix
**Author/agent:** @api

## What changed

- `src/config/env.ts` — added `API_VERSION = "/v1"` alongside `ENV.API_BASE_URL`. Services prepend it, matching the consumer storefront against the same backend.
- `src/features/auth/services/auth.service.ts` — `/auth/login` → `/v1/auth/login`; `/logout` → `/v1/auth/logout`.
- `src/lib/axios.ts` — replaced the bare "401 ⇒ clear + redirect" handler with a refresh-and-replay interceptor: a single shared in-flight refresh against `POST /v1/auth/refresh`, one replay per request via a `_retried` marker, `/v1/auth/*` excluded so it cannot recurse, and clear + redirect only when the refresh fails.
- `src/store/useAuthStore.ts` — added `setToken(access, refresh?)` for rotation without touching `user`/`permissions`, plus an `auth_remember` cookie so a refresh preserves the session's original lifetime.
- `src/lib/apiMappers.ts` (new) — `toRowId`, `toFk`, `toStatusUnion`/`fromStatusUnion`, `unwrapPaginated`, shared by the service swaps that follow.

## Why

- **Version prefix.** `VITE_API_BASE_URL` stops at `/api`, so every path needed `/v1`. `logout` was additionally wrong: the endpoint is `auth/logout`, so the old bare `/logout` never resolved — the session was only ever cleared client-side while the token stayed valid server-side until it expired.
- **Refresh.** Access tokens expire after 60 minutes. Without rotation the dashboard bounced to `/login` mid-session, even though `refresh_token` was already being stored and never used.
- **`toRowId`.** The API returns numeric ids; `DataTable<TData extends {id: string}>`, every column def and every `useDelete*(ids: string[])` are string-typed. Normalising on read keeps ~40 files and their tests untouched. `toFk` is the deliberate asymmetry: ids in a URL may be strings, but a body FK must be a number or it slips past `exists:` and misbehaves later in the DTO casts.
- **`unwrapPaginated`.** The envelope nests the paginator one level deeper than `PaginatedResponse<T>` describes (`res.data.data`). One helper instead of eleven chances to return the envelope by mistake.

## Bug found and fixed (also present in `web-topup-fe`)

`refreshInFlight ??= (async () => { … })()` memoised the refresh promise. When there was no refresh token the async body returned **without ever awaiting**, so its `finally { refreshInFlight = null }` ran *synchronously — before `??=` completed the assignment*. The variable was left holding a resolved-null promise permanently.

Effect: a single 401 while signed out disabled token refresh for the rest of the page's life. After logging in, the first expired access token logged the user straight back out instead of renewing.

Fixed by checking `refreshToken` *before* building the memoised promise, so the body always awaits. The identical fix was applied to `web-topup-fe/src/config/axios.ts`, where the pattern originated.

## Files touched

- `src/config/env.ts`
- `src/lib/axios.ts`, `src/lib/axios.test.ts`
- `src/lib/apiMappers.ts`, `src/lib/apiMappers.test.ts` (new)
- `src/store/useAuthStore.ts`
- `src/features/auth/services/auth.service.ts`, `src/features/auth/tests/auth.service.test.ts`
- (sibling repo) `web-topup-fe/src/config/axios.ts`

## Verification

- [x] Built TDD-first: refresh/replay/concurrency/failure cases written as failing tests, then implemented to green
- [x] `npm run test` passes — 53 files, 369 tests
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (7 pre-existing React-Compiler warnings on TanStack Table)
- [ ] `/qa-audit` run
- [x] No UI touched, so light/dark and Figma reconciliation are unaffected

## Notes / follow-ups

- The 11 mock services still need their bodies swapped to real endpoints; `apiMappers` exists for exactly that.
- Blocking API work found while verifying: `GET /v1/products` ignores `per_page` and has no filters, and `search` is missing on several admin list endpoints — the admin toolbar and page-size selector will silently no-op until those land.
- `GET /v1/payment-channels` is already a public route the storefront calls; admin CRUD cannot claim that URI without first moving the public read to `/v1/storefront/payment-channels`.

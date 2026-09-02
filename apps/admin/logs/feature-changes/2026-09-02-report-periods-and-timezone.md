# 2026-09-02 — Report periods (yearly + custom range) and timezone sync

**Scope:** `reports`, `dashboard` (navbar), `store/useAuthStore`, `hooks`
**Type:** feat
**Author/agent:** you

## What changed

- `ReportsPage` gains **Yearly** and a **Range** tab with first/last date pickers, alongside Daily and Monthly, plus the per-payment-channel breakdown the page subtitle already promised. Breakdown rows now carry profit.
- `DateField` promoted to `src/components/common/` (lifted out of `TransactionFilterBar`), and `toApiDate` added to `src/utils/date.ts`.
- `NavbarClock` — a live h:m:s clock with the timezone name, in the navbar.
- `useTimezoneSync` mounted in `DashboardLayout`; `useAuthStore` gains a `patchUser` action.
- `getApiErrorMessage` (`src/utils/apiError.ts`) surfaces the API's own 422 text.
- The dashboard's decorative "This Week" `Select` is now `disabled`.

## Why

- **`users.timezone` is the single source of truth.** The clock renders the *stored* value, not the browser's, and the API computes every report window from that same value — so what the admin sees on the clock and what the report counts can never refer to different days. On a failed sync the hook deliberately does nothing: both stay on the old zone, which is still self-consistent.
- **`toApiDate`, not `toISOString().slice(0,10)`.** The latter renders the UTC day, so a local-midnight pick east of Greenwich reports the previous date. `TransactionFilterBar:152` still has that bug; it is left for a separate commit because fixing it changes the transactions API contract.
- **`patchUser` writes the cookie as well as the store.** `user` is rehydrated from `auth_user` on every full page load, so skipping the cookie would revert the timezone on refresh — and the PATCH would then re-fire forever.
- **`NavbarClock` is its own leaf.** A per-second `setInterval` inside `DashboardNavbar` would re-render the breadcrumb trail and user dropdown once a second for the whole session.
- **`makeUser().timezone` now defaults to the host zone.** A hardcoded `"Asia/Jakarta"` would make every protected-route test fire an unmocked PATCH on any CI box outside WIB.
- The dashboard's "This Week" dropdown has never been wired to anything. Shipping a real period filter next door would have made a fake one read as a bug.

## Files touched

- `src/features/reports/**`
- `src/components/common/DateField.tsx`, `src/utils/{date,apiError}.ts`
- `src/hooks/useTimezoneSync.ts`, `src/store/useAuthStore.ts`
- `src/features/dashboard/components/{NavbarClock,DashboardNavbar}.tsx`, `layouts/DashboardLayout.tsx`, `pages/DashboardPage.tsx`
- `src/test/test-utils.tsx`

## Verification

- [x] `npm run test` passes (582 tests, 94 files)
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean (0 errors)
- [x] Tokens only, both themes
- [ ] Manual: set an admin's `users.timezone` to `Pacific/Auckland` and confirm the clock, the "Today" caption and the Daily figures all move together

## Notes / follow-ups

- The dashboard chart's `DATE(created_at)` buckets are still UTC on the API side — the window is timezone-correct, the buckets are not. Shifting them needs MySQL-only SQL that would break the API's SQLite test suite.
- `TransactionFilterBar` should be moved onto `DateField` + `toApiDate` in a follow-up.

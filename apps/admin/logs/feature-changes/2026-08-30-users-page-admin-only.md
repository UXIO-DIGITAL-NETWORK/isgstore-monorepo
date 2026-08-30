# 2026-08-30 — Users page shows admin accounts only

**Scope:** administration / Users list page
**Type:** fix
**Author/agent:** you

## What changed
- `UserListPage` now sends `role: "admin"` on every `GET /v1/users` request, so the table shows only real admin accounts.
- Page description text updated to reflect that this list is admin accounts, not registered customers.
- Backend `GET /v1/users` gained a name-based `role` filter (`admin|member|vip|reseller|agent|payment-internal|payment-admin`), resolved via `Role::whereRaw('LOWER(name) = ?', ...)` — same convention as `EnsureUserIsAdmin` — instead of a fragile hardcoded `role_id`.
- Backend query now eager-loads the `role` relation, so the Role column (previously always blank because `UserResource`'s `whenLoaded('role', ...)` had nothing loaded) now renders correctly too.

## Why
- The Users page was listing every account sharing the platform's single `users` table — including `Client Merchant` (payment-admin), `Uxio Hub (sistem)` and `Internal Finance` (both payment-internal) — none of which are dashboard admins. User asked to show only admin-web accounts.

## Files touched
- `src/features/administration/pages/UserListPage.tsx`
- `src/features/administration/pages/UserListPage.test.tsx` (new)
- `src/features/administration/types/administration.type.ts`
- `../../web-topup-api/app/Http/Requests/User/IndexUserRequest.php`
- `../../web-topup-api/app/DTOs/User/UserFilterDTO.php`
- `../../web-topup-api/app/Actions/User/GetUsersAction.php`
- `../../web-topup-api/tests/Feature/UserManagementTest.php`

## Verification
- [x] Built TDD-first: test cases defined, failing tests written, then implemented to green
- [x] `npm run test` passes (administration feature: 5 files, 23 tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean
- [ ] `/qa-audit` run
- [ ] Renders in both light and dark (only page copy + data changed, no new UI)
- [ ] Reconciled against Figma frame

## Notes / follow-ups
- Backend: `composer run test` — 795 passed, 1 skipped; `./vendor/bin/pint --dirty` passed.

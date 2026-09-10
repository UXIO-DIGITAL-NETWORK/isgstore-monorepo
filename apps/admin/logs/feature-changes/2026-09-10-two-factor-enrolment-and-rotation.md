# 2026-09-10 — Two-factor enrolment moves to post-login; authenticator can be moved

**Scope:** auth (enrolment screen, security settings), routing guards
**Type:** feat
**Author/agent:** you

## What changed

- **Enrolment is now a step between signing in and the dashboard.** New pathless
  group `_enrolment` (reuses `AuthLayout`, no sidebar) serving `/two-factor-setup`,
  guarded by `requireAuth` + `requireTwoFactorPending`. `_protected` gained
  `requireTwoFactorSatisfied`, and `useLogin`/`useVerifyTwoFactor` route straight
  there so the dashboard is never mounted for a frame it will be thrown out of.
- **`/admin/security/two-factor` is gone**, replaced by
  `/admin/settings/security` (`SecuritySettingsPage`) — status, moving the
  authenticator, disabling. It now has a sidebar entry under Administration;
  the old page had no menu link at all and was reachable only by being thrown
  there from a failed request.
- **New: move the authenticator to another device.** Password + a code from the
  current device issues a new secret; a code from the new device promotes it.
  API side: `two_factor_pending_secret` / `two_factor_pending_created_at`,
  `TwoFactorAction::rotate` / `confirmRotation`, `POST /v1/auth/2fa/rotate` and
  `/rotate/confirm`, `two_factor_pending` on `UserResource`.
- **`confirm` (and `rotate/confirm`) now return a session.** They still revoke
  every token; the fresh pair is minted after that sweep, so the admin is not
  asked to sign in twice.
- **Bug fixed:** the old setup page read `user.two_factor_confirmed_at`, which
  `UserResource` has never emitted — so `alreadyEnabled` was permanently false
  and an enrolled admin was shown "Start setup", which could only 409. The
  field is removed from `User` so the mistake cannot recur; `two_factor_enabled`
  is the only answer.
- `setAuth`'s `remember` argument now carries over via the exported
  `readRememberChoice()`, so re-issuing a session mid-flight no longer demotes a
  30-day login to session-only.

## Why

- The old screen lived inside `_protected`, i.e. inside `DashboardLayout`. An
  admin owing a factor was thrown there by the axios 403 branch *after* landing
  on a dashboard whose every request was being refused — a required onboarding
  step that read as a system error.
- Moving an authenticator had no self-service answer at all. The only route was
  disable → re-enrol, which signs the admin out mid-act and leaves the account
  with **no** second factor in between. The pending-secret column closes that
  window: the old device keeps working until the new one is proven.
- The 403 interceptor branch is kept deliberately, now as the safety net for
  sessions whose `auth_user` cookie predates the 2FA fields.

## Files touched

- `src/routes/_enrolment.tsx`, `src/routes/_enrolment/two-factor-setup/index.tsx`
- `src/routes/admin/_protected.tsx`, `src/routes/admin/_protected/settings/security/index.tsx`
- `src/features/auth/components/TwoFactorEnrolCard.tsx` (extracted, shared by both flows)
- `src/features/auth/pages/{TwoFactorEnrolmentPage,SecuritySettingsPage}.tsx`
  (replacing `TwoFactorSetupPage.tsx`), `src/features/auth/index.ts`
- `src/features/auth/{hooks/useLogin.ts,services/auth.service.ts}`
- `src/middlewares/authMiddleware.ts`, `src/store/useAuthStore.ts`,
  `src/models/user.model.ts`, `src/lib/axios.ts`
- `src/features/dashboard/components/DashboardSidebar.tsx`,
  `src/features/dashboard/layouts/DashboardLayout.tsx`
- API: `apps/api` — migration `2026_09_10_000001_add_two_factor_pending_secret`,
  `TwoFactorAction`, `TwoFactorController`, two new `Auth` FormRequests,
  `routes/api.php`, `UserResource`, `User`, `UserFactory`,
  `DisableTwoFactor` command, `CLAUDE.md`

## Verification

- [x] Built TDD-first: test cases defined, failing tests written, then implemented to green
- [x] `npm run test` passes — 612 tests, 97 files. New:
      `src/middlewares/twoFactorMiddleware.test.ts`,
      `src/features/auth/tests/{TwoFactorEnrolment,SecuritySettings}.test.tsx`
- [x] `tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 11 pre-existing `react-hooks/incompatible-library` warnings)
- [x] API: `composer run test` — 1047 passed; `pint` clean. `TwoFactorTest` gained
      9 cases, including the load-bearing one: after `rotate`, the **old**
      authenticator still passes the login challenge.
- [ ] Renders in both light and dark — not yet checked in a browser
- [ ] Reconciled against Figma — no frame exists for these screens

## Notes / follow-ups

- `SiteAvailabilityTest`'s exempt-route list gained the two rotate routes. Same
  standing as `2fa/setup`/`confirm` already there: still behind `auth:sanctum`,
  and an admin must be able to reach the panel where they pay to switch a
  suspended site back on.
- **Rotation still does not help an admin who lost the device** — it requires a
  live code by design. `php artisan two-factor:disable {email}` remains the only
  recovery, as `apps/api/CLAUDE.md` already records. Recovery codes are still
  owed by the release that extends 2FA to `payment-admin`, who have no shell.
- An unfinished move cannot be resumed in the UI: the secret travels exactly
  once, so there is no QR left to re-render. The page says a move is outstanding
  and that starting again replaces it — the honest answer, and cheap, since the
  live authenticator never stopped working.

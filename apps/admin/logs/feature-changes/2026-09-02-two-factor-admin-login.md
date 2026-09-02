# 2026-09-02 — Google Authenticator for admin login

**Scope:** `auth`, `lib/axios`
**Type:** feat
**Author/agent:** you

## What changed

- `useLogin` branches on a 2FA challenge instead of calling `setAuth` directly; `TwoFactorStep` collects the six-digit code using the shadcn `input-otp` primitive that already shipped unused.
- New `/admin/security/two-factor` enrolment page: QR (via `useQrDataUrl`) plus the base32 secret as selectable text.
- `lib/axios.ts` gains an explicit branch on the API's `two_factor_setup_required` code and routes the admin to enrolment.

## Why

- The challenge is **not** stored in `useAuthStore`: `requireGuest` redirects anyone holding a token and the axios interceptor would attach it as a Bearer. It lives in login-page component state, so reloading mid-challenge means logging in again — correct, not a bug.
- Without the explicit 403 branch the admin saw a random error toast from whichever of the page's several requests lost the race.
- The secret is always shown as text, because that is the way out when the camera fails.

## Files touched

- `src/features/auth/**` (new: `components/TwoFactorStep.tsx`, `hooks/useQrDataUrl.ts`, `pages/TwoFactorSetupPage.tsx`, `tests/TwoFactorLogin.test.tsx`)
- `src/lib/axios.ts`, `src/models/user.model.ts`, `src/routes/admin/_protected/security/**`

## Verification

- [x] Built TDD-first
- [x] `npm run test` passes
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean

## Notes / follow-ups

- No Google credentials are involved — TOTP is an offline algorithm; "Google Authenticator" is just one app that implements it.
- `input-otp` calls `document.elementFromPoint` from a `setTimeout`, which jsdom does not implement. Because it fires on a timer it landed after the test finished, so it surfaced as an unhandled exception that failed the whole run while every test passed. Stubbed in `src/test/setup.ts` alongside the other jsdom gaps.

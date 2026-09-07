# payout-banks-from-api — the bank catalogue is fetched, not bundled

**Date:** 2026-08-30
**Author:** you

## What

`src/constants/bankCodes.ts` — a hand-maintained copy of the API's
`config/banks.php` — is deleted. The catalogue now comes from
`GET /v1/payout-banks` through a new shared hook, `src/hooks/usePayoutBanks.ts`
(`usePayoutBanks`, plus `isEwalletCode` and `bankLabel`), cached for the session
so both withdrawal forms and the picker share one request.

`BankCombobox` lists what the hook returns. The two withdrawal schemas stop
validating `bank_code` against a bundled `z.enum(...)` and only require that
something was picked — the server validates the code itself. The
bank-vs-e-wallet branch (account number vs. phone) reads `is_ewallet` off the
fetched row instead of a local `EWALLET_CODES` array; it is mirrored into form
state as `is_ewallet` so the schema's `superRefine` can branch without knowing
the catalogue, and both pages build their request payload field by field so that
flag never reaches the API.

## Why

The refund work added a second consumer of the same list (the admin refund queue
and the guest claim page), which is what turned "one copy to keep in sync" into
three. The two lists still agreed exactly — 170 codes, identical names — the day
this landed, so nothing was broken yet; nothing was keeping them that way
either, and the failure mode is silent: an operator picks a code the API then
rejects, or a new e-wallet gets treated as a bank and the payout is keyed on an
account number Monetapay has no use for.

Fetching also means adding a bank is a backend release, not a frontend one.

## Files

- `src/hooks/usePayoutBanks.ts` (new) — the query, plus `isEwalletCode` and
  `bankLabel`. Non-list bodies degrade to `[]`; every consumer maps over this.
- `src/hooks/usePayoutBanks.test.ts` (new)
- `src/components/common/BankCombobox.tsx` — fetches its own options; shows
  "Memuat daftar bank…" before the catalogue arrives rather than "Bank tidak
  ditemukan", and falls back to the bare code when a value is set before then.
- `src/components/common/BankCombobox.test.tsx` (new) — the picker had no test.
- `src/features/merchant/schemas/withdrawal.schema.ts`,
  `src/features/finance/schemas/internalWithdrawal.schema.ts` — `bank_code` is a
  non-empty string; new `is_ewallet` form field drives the account-number rule.
- `src/features/merchant/pages/MerchantWithdrawalsPage.tsx`,
  `src/features/finance/pages/InternalWithdrawalsPage.tsx` — read the rail from
  the catalogue, mirror it into form state, build the payload explicitly.
- `src/test/payoutBanks.ts` (new) — shared `mockPayoutBanks()` stub + fixture.
- `src/features/merchant/tests/MerchantWithdrawalsPage.test.tsx`,
  `src/features/finance/tests/InternalWithdrawalsPage.test.tsx` — stub the
  catalogue; a new case proves an e-wallet payout submits on the phone alone and
  without `is_ewallet`.
- `src/constants/bankCodes.ts` — deleted.

Backend-side, `uxiotopup-api/config/banks.php`'s header no longer tells the
reader to keep this repo's copy in sync, because there is no copy.

## Verification

- [x] Test-first: the hook and picker tests were written red before either file existed
- [x] `npm run test` — 185 passed (36 files)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors; 3 `react-hooks/incompatible-library` warnings, all pre-existing (`DataTable`, and the two pages' existing `watch()` calls)
- [x] Verified the deleted list and `config/banks.php` were byte-identical on 170 codes and names before removing it, so no destination was lost

## Notes

The picker's empty state is now reachable in a way it never was: if
`/v1/payout-banks` fails, the withdrawal form renders with no options rather
than a stale-but-usable list. That is the right trade — offering codes the API
may reject is worse — but it does make the withdrawal form depend on one more
endpoint.

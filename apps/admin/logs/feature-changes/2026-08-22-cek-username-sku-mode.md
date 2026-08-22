# 2026-08-22 — Cek Username: first-class Digiflazz SKU picker

**Scope:** categories → `NicknameCheckField` (+ shared `useCekUsernameSkuOptions` hook)
**Type:** feat
**Author/agent:** you

## What changed
- Added a 4th mode **"Digiflazz cek-username SKU"** to the category `NicknameCheckField`. It renders a dropdown of Digiflazz cek-username/inquiry SKUs (pulled live from the price list) so an operator can turn on Cek Username for a game without pasting a raw `digiflazz:sku` string.
- `detectMode()` now routes `digiflazz:` values to the new mode (previously lumped under "Custom URL"), so the seeded MLBB/Free Fire values (`digiflazz:mlus` / `digiflazz:ffusername`) surface in the proper picker automatically — no data migration.
- New shared hook `src/hooks/useCekUsernameSkuOptions.ts` (mirrors `useProductOptions`) hitting the new backend endpoint `GET /v1/digiflazz/cek-username-skus`.
- Backend (web-topup-api): new `ListCekUsernameSkusAction` + `DigiflazzCekUsernameSkuController` + route; reads the cached prepaid price list and filters to cek-username SKUs by name-needle.

## Why
- The feature was already data-driven via `categories.validasi_nickname`, but the only way to configure a Digiflazz SKU was the "Custom URL" text box — it read as hard-coded to operators. A dedicated, discoverable picker makes it controllable from admin.
- Stored value contract stays `digiflazz:{sku}`, already understood by `ValidateGameIdAction`, so the storefront path is untouched.
- **Provisional:** cek-username SKUs are identified by a name-match constant (`CEK_USERNAME_NEEDLES`) since Digiflazz has no machine flag — confirm against the live price list and tune if a SKU is missed.

## Files touched
- `src/features/categories/components/NicknameCheckField.tsx`
- `src/hooks/useCekUsernameSkuOptions.ts`
- `src/features/categories/tests/NicknameCheckField.test.tsx`
- (backend) `app/Actions/Digiflazz/ListCekUsernameSkusAction.php`, `app/Http/Controllers/Api/Digiflazz/DigiflazzCekUsernameSkuController.php`, `routes/api.php`, `tests/Feature/Digiflazz/ListCekUsernameSkusTest.php`

## Verification
- [x] Built TDD-first: failing tests written, then implemented to green
- [x] `npm run test` passes (full suite: 468 tests; new `NicknameCheckField.test.tsx`: 6)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean
- [ ] `/qa-audit` run
- [ ] Renders in **both** light and dark (token-only; not manually screenshotted)
- [ ] Reconciled against Figma (no frame — additive to existing form)

## Notes / follow-ups
- Backend: verify `CEK_USERNAME_NEEDLES` catches `mlus`/`ffusername` against the live cached price list (`php artisan tinker` → `app(DigiflazzService::class)->getPriceListCached()`); prefer a clean `category` discriminator if one exists.
- A shadcn `Select` won't render a label for a stored value absent from `options`; the value is still preserved on save. Optional enhancement: inject the current value as a synthetic option when missing.

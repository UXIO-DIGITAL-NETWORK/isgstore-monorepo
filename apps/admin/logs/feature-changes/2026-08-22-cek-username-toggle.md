# 2026-08-22 — Cek Username: per-game enable/disable master toggle

**Scope:** categories → `NicknameCheckField` + `CategoryFormDialog` (+ schema/type/service); backend `categories.nickname_check_enabled`
**Type:** feat
**Author/agent:** you

## What changed
- Added a per-game **master on/off Switch** for the "Cek Username" check in the category form. OFF ⇒ the storefront hides the button and checkout no longer requires a resolved nickname; ON ⇒ the check runs via the existing provider config.
- The provider selector (product / Digiflazz SKU / URL) now renders **only when enabled**; the redundant "None" mode was dropped (the Switch is the on/off). Disabling **keeps** the provider value, so a game can be re-enabled without re-picking.
- Backend: new `categories.nickname_check_enabled` boolean (default `true`). Storefront flag is now `supports_nickname_check = nickname_check_enabled && validasi_nickname !== ''` (`GameDetailResource`).

## Why
- Previously the only way to turn the check off was to blank the provider — losing the config. The operator wanted a clean enable/disable that keeps data flexible (confirmed: per-game; toggle is a master switch, provider stays as the "how").
- Default `true` means every existing row keeps today's behaviour (no backfill, no seeder change, no regression) until an operator flips a game off.

## Files touched
- (be) `database/migrations/2026_08_22_000001_add_nickname_check_enabled_to_categories.php`, `app/Models/Category.php`, `app/Http/Resources/Api/Storefront/GameDetailResource.php`, `app/Http/Requests/Category/{Store,Update}CategoryRequest.php`, `app/DTOs/Category/{Create,Update}CategoryDTO.php`, `app/Actions/Category/{Create,Update}CategoryAction.php`, `tests/Feature/{CategoryCrudTest,Storefront/StorefrontOrderTest}.php`
- (fe) `src/features/categories/components/{NicknameCheckField,CategoryFormDialog}.tsx`, `schemas/categoryForm.schema.ts`, `types/category.type.ts`, `services/categories.service.ts`, `tests/{NicknameCheckField.test.tsx,categories.service.test.ts}`

## Verification
- [x] Built TDD-first for the FE component (failing tests → green); BE tests added for the storefront flag + persistence round-trip.
- [x] `npm run test` passes (471) incl. updated `NicknameCheckField` (7) + service round-trip.
- [x] `npx tsc -b --force` clean; `npm run lint` 0 errors (pre-existing `watch()` warning pattern only).
- [x] BE relevant suites green (49); `./vendor/bin/pint` clean.
- [ ] Renders in both themes (token-only; not manually screenshotted).

## Notes / follow-ups
- Enabling with no provider chosen shows a hint ("Pilih provider agar pengecekan berjalan"); functionally the check stays inert until a provider is picked (`supports = enabled && provider`).
- Requires `php artisan migrate` on each environment (the new column). Skipped locally — env is flagged production.
- Unrelated: `ImportDigiflazzProductsTest` xlsx-template test still OOMs in this environment (pre-existing, 128M worker limit) — not touched by this change.

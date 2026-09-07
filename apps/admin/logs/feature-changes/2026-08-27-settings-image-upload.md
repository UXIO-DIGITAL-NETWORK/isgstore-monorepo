# 2026-08-27 — Settings image upload

**Scope:** administration / Settings
**Type:** feat
**Author/agent:** you

## What changed
- Image-typed settings now render an `ImageDropzone` (plus a preview of the current
  file) instead of the static text "No file uploaded. — images are managed through the
  upload endpoint."
- New `settingsService.upload(key, file)` + `useUploadSetting`; `Setting` gained
  `value_url`.
- The page no longer renders its own `<Label>` for an image setting — the dropzone
  supplies one, and two labels pointing at one input is an a11y defect.
- **API:** `SettingResource` gained `value_url` (via `MediaUrl::for`).

## Why
- `POST /v1/settings/upload` has existed the whole time (jpeg/png/webp/svg/ico, max
  2 MB) — only the UI was missing, so a logo or favicon could not be changed from the
  admin at all.
- Image settings keep their own write path: the bulk save carries a `{key: value}` map
  and cannot carry a file, and the endpoint replaces the stored file rather than setting
  a string.
- SVG and ICO are accepted deliberately: a favicon and a vector logo must keep their
  format, and `compressImage` passes both through untouched.
- `value` alone is a storage path the admin cannot render, hence `value_url`.

## Files touched
- `src/features/administration/{pages/SettingsPage.tsx,services/administration.service.ts,hooks/useAdministration.ts,types/administration.type.ts}`
- `src/test/fakeApi.ts` (an image setting fixture)
- `src/features/administration/tests/administration-routes.test.tsx`
- api: `app/Http/Resources/Api/Content/SettingResource.php`

## Verification
- [x] Built TDD-first (both new tests failed first)
- [x] `npm run test` passes
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean
- [x] Pint clean on the API resource

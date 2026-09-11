# 2026-09-11 — Admin panel goes bilingual (ID/EN)

**Scope:** the whole app — all 16 feature slices plus `components/common` and the shell
**Type:** feat
**Author/agent:** you

## What changed

- **1,269 keys extracted across 18 namespaces** — one per feature slice (`products` 219,
  `categories` 206, `transactions` 172, `content` 161, `refunds` 96, `dashboard` 67,
  `marketing` 63, `administration` 54, `auth` 43, `membership` 32, `integration` 30,
  `pricing` 28, `reports` 22, `financial` 18, `feedback` 13, `activity` 10) plus
  `common` 27 and `navbar` 8. Both locales are complete; nothing is a stub.
- **New `src/lib/i18nOptions.ts`** (`translateOptions`) — the one helper for resolving
  keyed option lists. It replaced three copies I had inlined before noticing.
- Shared primitives translated: `DataTable`, `ImageDropzone`, `FieldLabel`,
  `DeleteConfirmDialog`, `CopyButton`.
- **Mixed-language spots fixed along the way**, all of them Indonesian text stranded on an
  otherwise English panel: `FinancialPage` ("Saldo Aktif"/"Saldo Tertahan"),
  `NicknameCheckField` ("Cek Username", "Pilih provider agar pengecekan berjalan"),
  `WebsiteSubscriptionCard`.
- **Bug found and fixed:** four `useMemo` column definitions read `t` with `[]` as their
  dependency array — a stale memo that would have frozen those column headers at the
  language loaded on first render. React Compiler caught it; 32 lint errors, now zero.
- Breadcrumb tab labels in `DashboardNavbar` were three module-scope `Record<string,string>`
  maps of English sentences; they now hold keys.

## Why

- This was the last and largest piece of the platform-wide ID/EN work: the admin panel was
  ~1,000 hardcoded strings across 156 files, all English, on a platform whose default is
  Indonesian.
- Done with a purpose-built two-mode helper (`report` lists every literal in a file;
  `apply` rewrites exactly the ones named in a map) rather than by eye. Reading 156 files
  by hand is how a hundred strings get missed; the tool made the gap measurable, and a
  re-run of `report` after each feature is what proved a slice was finished.
- **The harness pin is what made this reviewable.** `src/test/setup.ts` pins `en`, and
  the panel's strings were already English — so extracting a string into `locales/en` left
  every assertion passing unchanged, and a genuine copy change showed up as a failure
  rather than hiding in a 156-file diff. 634 tests stayed green from the first feature to
  the last.

## Files touched

Every file under `src/features/*/` that renders text, plus:

- `src/config/i18n.ts` (18 namespaces), `src/locales/{id,en}/*.json` (36 files, new)
- `src/lib/i18nOptions.ts` (new)
- `src/components/common/{DataTable,ImageDropzone,FieldLabel,DeleteConfirmDialog,CopyButton}.tsx`
- `src/features/dashboard/{components/DashboardNavbar.tsx,data/nav-groups.data.ts}`
- `src/features/{products,transactions,categories}/types/*.ts` — gained `KeyedSelectOption`
- `CLAUDE.md`, `docs/02-arsitektur.md`

## Verification

- [x] `npm run test` — 634 tests / 101 files, green throughout
- [x] `tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 12 pre-existing `react-hooks/incompatible-library` warnings)
- [x] Measured sweep: 0 user-facing literals left outside fixtures, brand names and status sentinels
- [ ] Renders in both light and dark — not yet checked in a browser
- [ ] Not reconciled against Figma — no frame covers a language switcher

Also fixed here, found while measuring: three `renderRoute()` calls in
`features/{feedback,activity}/tests/` were not awaited despite the helper being async. A
pre-existing bug; the `beforeAll` in the i18n harness shifted timing enough to expose it.

**A note on running the suite:** at default concurrency this machine starves and one
arbitrary test times out at ~18s per run (a different one each time). `--maxWorkers=2` is
green every time. Not a code problem — worth knowing before chasing a phantom.

## Notes / follow-ups

**Deliberately left untranslated**, each for a reason:

- Brand and vendor names — Uxiolabs, Zelpoint, Moonton API, Riot API, UniPin SKUs.
- Fixture data under `features/*/data/` and `src/test/` — "Randy Galang", "19 Diamond".
  These are placeholder rows, not copy.
- Status sentinels (`?? "PENDING"`, `?? "NONE"`) — protocol values, not prose.
- Numeric placeholder examples (`100000`, `you@company.com`).
- **Zod schema messages.** A schema is built at module scope with no `t` in reach.
  Field-level validation copy is its own piece of work, and it should probably lean on the
  API's `lang/{id,en}/validation.php` rather than a second catalogue.

**Remaining across the platform:** only the **API message triage** — ~4,000 literals in
`app/Http/Controllers` and `app/Actions` to narrow down to the few hundred a user actually
reads, plus `ApiResponse`. The locale middleware, `lang/id/validation.php` and
`PATCH /v1/me/locale` that this all depends on already shipped.

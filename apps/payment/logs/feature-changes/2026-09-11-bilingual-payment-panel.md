# 2026-09-11 — Payment panel goes bilingual (ID/EN)

**Scope:** whole app — shell, `merchant` (client view), `finance` (kita view), shared `components/common`
**Type:** feat
**Author/agent:** you

## What changed

- **i18next wired up** (`src/config/i18n.ts`), four namespaces under `src/locales/{id,en}/`:
  `common` (tables, filters, confirm dialogs, error pages, bank picker), `nav` (sidebar),
  `merchant`, `finance`. Roughly **340 strings extracted across ~35 files** — every
  user-facing string in the app except numeric format examples.
- **Language switcher in the navbar**, backed by `useLocale` — the one place the
  language changes, writing i18next + `localStorage` + `users.locale` together.
- **The theme bugs from the admin panel were here too**, and are fixed the same way:
  the toggle was a binary `light ⇄ dark` flip over three states (so a dark-OS user
  pressing the moon got light, and `system` became unreachable), and `index.html`
  hardcoded `class="dark"` so a stored `light` theme flashed dark on every cold load.
- `useAuthStore` gained `patchUser`, matching the admin panel's.
- **Column headers and select options became factories** (`columnsFor(t)`,
  `translated(OPTIONS, t)`). As module constants they froze whichever language was
  loaded at import and never updated.
- `__root.tsx` went back to being a registry: its 404 and 503 copy moved into
  `components/common/ErrorPages.tsx`, where it can be translated.
- **Three decorative `alt` texts became `alt=""`** rather than being translated — a
  screen reader announcing "FAQ Illustration" adds nothing. (Storefront; noted here
  because it is the same judgement call.)

## Why

- This app was **accidentally bilingual already**: "Simpan" sat beside English
  buttons on the same screen, "Saldo" beside "Go Check". Extraction was the fix for
  that, not just groundwork for a language switch.
- `users.locale` rather than a cookie, because it is the only place the choice can
  follow a client to another device — and because the API's `SetLocale` middleware
  reads it to decide which language to answer in. A switcher writing only
  `localStorage` would leave the panel in one language and its error toasts in
  another.
- **No locale segment in the URL** (unlike the storefront): these screens are not
  linked in a given language, and the route rewrite would have bought nothing.

## Files touched

- `src/config/i18n.ts`, `src/locales/{id,en}/{common,nav,merchant,finance}.json` (new)
- `src/hooks/useLocale.ts`, `src/components/common/{LocaleSwitcher,ErrorPages}.tsx` (new)
- `src/components/common/{DataTable,TransactionFilters,RecapDialog,DeleteConfirmDialog,InstallationProgress,TransactionSummaryPills,BankCombobox,ThemeToggle}.tsx`
- `src/features/dashboard/components/DashboardSidebar.tsx`, `src/features/dashboard/components/DashboardNavbar.tsx`
- every page and dialog under `src/features/{merchant,finance}/`
- `src/providers/theme-provider.tsx`, `index.html`, `src/main.tsx`,
  `src/store/useAuthStore.ts`, `src/features/auth/services/auth.service.ts`
- `src/routes/__root.tsx`, `src/test/{setup.ts,test-utils.tsx}`
- `CLAUDE.md` (new **Language (ID/EN)** section), `docs/02-arsitektur.md`

## Verification

- [x] `npm run test` — 204 tests / 37 files, green throughout the extraction
- [x] `tsc -b --force` clean; `npm run lint` clean (0 errors, 3 pre-existing warnings)
- [ ] Renders in both light and dark — not yet checked in a browser
- [ ] Not reconciled against Figma — no frame covers a language switcher

Two tests were updated rather than worked around, and both because the **copy
genuinely changed language**, not because the assertion was inconvenient:
`MerchantDashboardPage` (the Website Services card was hardcoded English on an
Indonesian screen) and `StatusPage` (same, for the 404/503 pages).

## Notes / follow-ups

- **The harness is pinned to `id` here**, unlike the admin panel's `en`. That is what
  made the extraction reviewable: this app's tests query Indonesian accessible names,
  so moving a string into `locales/id` leaves them passing unchanged, and a genuine
  copy change stands out as a failure.
- **Numeric placeholders left alone** — `100000`, `1234567890`, `08123456789`,
  `you@company.com`, `••••••••`. They are format examples, not prose.
- Remaining across the platform, in the agreed order: **admin** (~1,300–1,600 strings,
  ~190–220 files — most screens are still hardcoded English) and then **API message
  triage** (~4,000 literals down to the few hundred a user actually reads).
- When the admin extraction happens: `formatCurrency` **deliberately ignores its
  `locale` argument** and pins `id-ID`. Routing it through the page locale renders
  `IDR 15.231` instead of `Rp 15.231`. Reasoning is in `apps/api/CLAUDE.md`.

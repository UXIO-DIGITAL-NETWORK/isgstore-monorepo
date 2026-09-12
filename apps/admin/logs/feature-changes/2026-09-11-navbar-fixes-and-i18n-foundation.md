# 2026-09-11 — Navbar fixes, and the foundation for ID/EN across the platform

**Scope:** dashboard (navbar), theme, sidebar; plus i18n groundwork in api / admin / payment / storefront
**Type:** fix + feat
**Author/agent:** you

## What changed

### Navbar — the things that were silently wrong

- **Logout now revokes the server session.** It called `clearAuth()` and navigated,
  leaving a 60-minute access token and a **30-day refresh token alive** on a panel
  that keeps both in JavaScript-readable cookies. `useLogout` already did the right
  thing and was **orphaned** — nothing imported it. The navbar now uses it.
- **The sidebar remembers being collapsed.** `setOpen` wrote the `sidebar_state`
  cookie; nothing ever read it back (upstream shadcn is a Next.js pattern where a
  server component passes `defaultOpen`, and the Vite port kept only the write).
  Added `readStoredSidebarState()`.
- **Theme is a three-way choice.** It was a binary `light ⇄ dark` flip over three
  states: from the initial `system` it computed `light`, so a dark-OS admin pressing
  the moon got **light**, and `system` became unreachable. Also `index.html` hardcoded
  `class="dark"` while the provider applied the real choice after paint, so a stored
  `light` **flashed dark on every cold load** — replaced with a pre-paint script reading
  the same key. `system` now also follows an OS that changes at sunset.
- **Pages have their own names.** `PAGE_TITLES` mapped two routes; everything else
  fell through to the literal `"Dashboard"`, so `/admin/users`, `/admin/refunds`,
  `/admin/reports` all announced themselves as the dashboard. Titles now derive from
  `NAV_GROUPS`, lifted out of `DashboardSidebar` into
  `features/dashboard/data/nav-groups.data.ts` and shared. A plain title also renders
  as a one-crumb breadcrumb, so both shapes announce identically.

### Bilingual foundation (ID/EN, default Indonesian)

- **API:** `App\Support\Locale\SupportedLocale` as the one definition of the set;
  `SetLocale` middleware appended to the `api` group (`users.locale` →
  `Accept-Language` → config); `lang/id/validation.php`; `APP_LOCALE=id`;
  `PATCH /v1/me/locale`. `GoogleLoginAction` no longer writes `en` for every Google
  signup.
- **Admin + payment:** i18next wired up, `src/locales/{id,en}/`, `useLocale` as the
  single place the language changes, and a `LocaleSwitcher` in the navbar. Admin's sits
  in the slot `product_requirements.md:78` reserved for a "language/utility action" —
  which had shipped as a lightning icon with no handler.
- **Storefront:** fixed the language switcher. It navigated to `/$locale` — the locale
  **root** — so switching language on `/id/checkout/INV-123` dropped the buyer on
  `/en`, mid-purchase. New `swapLocaleInPath` in `src/lib/locale.ts` (in `lib/` because
  storefront's Vitest only runs `.ts`).
- Payment also got the theme and dark-flash fixes; it had the identical bugs.

## Why

- The navbar looked finished and was not. The logout was the serious one: a panel that
  moves money leaving refresh tokens alive after "sign out" is a real exposure, and the
  correct implementation was already sitting in the repo unused.
- On the language question — yes, it is feasible, and most of the pattern was already
  proven in the storefront (974 real ID/EN keys, both sides complete). What was missing
  was a single source of truth: the API had **no locale middleware at all** and its
  config default (`en`) contradicted every column default (`id`).
- `users.locale` is the authority rather than a cookie, because it is the only place
  the choice can follow a person to another device — and because the API needs it to
  decide what language to answer in.

## Files touched

- `src/features/dashboard/components/DashboardNavbar.tsx`,
  `src/features/dashboard/data/nav-groups.data.ts` (new),
  `src/features/dashboard/components/DashboardSidebar.tsx`
- `src/components/ui/sidebar.tsx`, `src/components/common/ThemeToggle.tsx`,
  `src/providers/theme-provider.tsx`, `index.html`
- `src/config/i18n.ts` (new), `src/locales/{id,en}/{common,navbar}.json` (new),
  `src/hooks/useLocale.ts` (new), `src/components/common/LocaleSwitcher.tsx` (new),
  `src/main.tsx`, `src/features/auth/services/auth.service.ts`, `src/models/user.model.ts`
- `src/test/{setup.ts,test-utils.tsx}` — harness pinned to `en`
- API: `app/Support/Locale/SupportedLocale.php`, `app/Http/Middleware/SetLocale.php`,
  `app/{Actions/User/UpdateUserLocaleAction,Http/Controllers/Api/User/UpdateLocaleController,Http/Requests/User/UpdateLocaleRequest}.php`,
  `lang/id/validation.php`, `lang/{id,en}/locale.php`, `bootstrap/app.php`,
  `config/app.php`, `.env.example`, `routes/api.php`, `GoogleLoginAction.php`
- Payment: `src/config/i18n.ts`, `src/locales/`, `src/hooks/useLocale.ts`,
  `src/components/common/{LocaleSwitcher,ThemeToggle}.tsx`, `src/providers/theme-provider.tsx`,
  `index.html`, `src/store/useAuthStore.ts` (gained `patchUser`), auth service, test harness
- Storefront: `src/lib/locale.ts` (new), `src/hooks/useLocaleDropdown.ts`
- Docs: `apps/admin/CLAUDE.md` (the "English-only" line is retired),
  `apps/api/CLAUDE.md` (new **Language (ID/EN)** section), `docs/02-arsitektur.md`

## Verification

- [x] Built TDD-first: test cases defined, failing tests written, then implemented to green
- [x] Admin `npm run test` — 634 tests / 101 files. New:
      `features/dashboard/tests/NavbarControls.test.tsx`,
      `components/common/ThemeToggle.test.tsx`, `hooks/useLocale.test.tsx`
- [x] Payment — 204 tests / 37 files; storefront — 100 / 13 (new `lib/locale.test.ts`)
- [x] API `composer run test` — 1072 passed; `pint` clean. New:
      `tests/Feature/Locale/{SetLocaleTest,UpdateLocaleTest}.php`
- [x] `tsc -b --force` and `eslint` clean in all three frontends (0 errors)
- [ ] Renders in both light and dark — not yet checked in a browser
- [ ] Reconciled against Figma — no frame covers these controls

Manual checks that no test replaces:

1. Load with a stored `light` theme — must not flash dark.
2. Collapse the sidebar, reload — must stay collapsed.
3. Log out, then replay the old `refresh_token` — must be rejected.
4. Switch language, reload, then sign in on another device — the choice follows.

## Notes / follow-ups

**Reported, deliberately untouched** (your call on each):

- **"?" and 🔔 are still inert** — focusable buttons that announce an action to screen
  readers and do nothing, which is worse for keyboard users than no button. `?` was
  specced as support/help (`product_requirements.md:78`); the bell has **no notification
  feature behind it at all** — searching `src/` for "notification" finds only its own
  `sr-only` label. The bell is the expensive one: table, endpoint, probably a realtime
  channel.
- **The avatar menu has one item.** The PRD specs "profile/logout"; there is no profile
  item and no route to point it at.
- **⚡ used to collide with Flash Sale** — the same `Zap` glyph meant two things in one
  viewport. Moot now that the slot is the language switcher.
- **Global search is in the wrong chrome** — the PRD puts it in the top bar; the command
  palette was built into the sidebar.

**Remaining i18n work**, in the agreed order: storefront residuals (small) → payment
(~450–500 strings, ~60–70 files) → admin (~1,300–1,600 strings, ~190–220 files) → API
message triage (~4,000 literals down to the few hundred users read).

When copying the formatting helpers onward: storefront's `formatCurrency` **deliberately
ignores its `locale` argument** and pins `id-ID`. Routing it through the page locale made
`/en` pages render `IDR 15.231` instead of `Rp 15.231`. Reasoning is in
`apps/api/CLAUDE.md`. Do not "fix" it.

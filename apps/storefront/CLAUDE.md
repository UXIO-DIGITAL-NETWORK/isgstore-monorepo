# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UDN Top Up Website** is a multi-game in-game currency top-up platform built as a responsive SPA (desktop-first). The primary user flow is **guest checkout** — users complete a purchase by entering only their Game ID and WhatsApp number, without registration. Registration is optional and unlocks a Member Dashboard (transaction history, saved game IDs).

Payment is processed exclusively through **Monetapay** (the frontend never calls Monetapay directly — the backend proxies all communication). The app is **multi-locale** with Indonesian (`id`, default) and English (`en`), reflected as a URL prefix (e.g. `/id/checkout/mobile-legends`).

## Reference Documents (Source of Truth)

This `CLAUDE.md` is a **condensed working reference**. For any decision involving business logic, data shape, visual fidelity, or architectural pattern, the following three documents are the **authoritative source of truth** and override anything implicit in code:

| Document                | Path                                      | Purpose                                                                                                 | When to Consult                                                                                    |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **PRD**                 | `.agents/context/product_requirements.md` | Product Requirements — user personas, workflows, feature specs, database schema                         | Adding/changing a feature, validating user flow, confirming DB field names, scoping a module       |
| **Design System**       | `.agents/context/design_system.md`        | UI/UX — color tokens, typography roles, spacing, component specs, section-by-section homepage breakdown | Building any UI component, picking a color/font/radius, replicating a Figma section pixel-fidelity |
| **System Architecture** | `.agents/context/system_architecture.md`  | Frontend architecture — directory layout, routing, state, i18n, provider stack, DoD checklist           | Adding a feature folder, wiring a route guard, choosing where a file belongs, reviewing PRs        |

**Auxiliary references:**

| File                                                                                                                                | Purpose                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `homepage-design.json`                                                                                                              | Raw Figma export (source data for `.agents/context/design_system.md` section 11) — consult when a value in the design doc seems ambiguous |
| `./agents/context/images/01 - Design homepage (top up game).png`                                                                    | Visual reference of the homepage                                                                                                          |

### Document Precedence Rules

When two documents conflict:

1. **Unversioned docs on disk are canonical** (`product_requirements.md`, `design_system.md`, `system_architecture.md`).
2. **PRD wins on business logic** (what the feature does, who can access it, DB fields).
3. **Design System wins on visual specs** (colors, fonts, spacing, component anatomy).
4. **System Architecture wins on code organization** (folder structure, routing, state, providers).
5. If `CLAUDE.md` conflicts with any of the three above, **the source document wins** — and `CLAUDE.md` should be updated to match.

### Mandatory Workflow

Before writing code, before answering an architectural question, before making any assumption about business logic or visual style:

1. **Identify which document covers the topic** (use the table above).
2. **Read the relevant section.** Do not work from memory of "what these docs probably say".
3. **If ambiguous, ASK** — do not guess. Per the project rules, assumption is forbidden.

## Tech Stack

| Layer         | Tool                                                           |
| ------------- | -------------------------------------------------------------- |
| Framework     | React 19 + TypeScript                                          |
| Build         | Vite                                                           |
| Styling       | Tailwind CSS **v4** (no config file — `@theme` directive only) |
| UI Primitives | **HeroUI** (not Shadcn)                                        |
| Routing       | TanStack Router (file-based, type-safe)                        |
| Server State  | TanStack Query                                                 |
| Client State  | Zustand                                                        |
| Forms         | React Hook Form + Zod                                          |
| i18n          | `react-i18next` + URL-based locale routing                     |
| HTTP          | Axios (with JWT interceptor)                                   |

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm run test       # Vitest, single run
npm run test:watch # Vitest, watch mode
npm run preview    # Preview the production build locally
```

`vitest.config.ts` is deliberately separate from `vite.config.ts` so the TanStack Router
plugin does not run during tests — it would regenerate `routeTree.gen.ts` and make a test
run mutate tracked source. It runs on the `node` environment and only picks up
`src/**/*.test.ts` (note: **not** `.tsx` — there is no DOM/canvas here, so the suite covers
pure logic: checkout mappers, nickname parsing, order-form validation, invoice review,
article helpers). `npm run test` gates the production deploy in
`.github/workflows/production.yml`.

Environment variable `VITE_API_BASE_URL` sets the backend URL, **including the `/api` prefix but not `/v1`** (default: `http://localhost:8000/api`). Copy `.env.example` to `.env` for local work; production injects it from the repository secret of the same name in `.github/workflows/production.yml`.

## Architecture Overview

Feature-based architecture (Bulletproof React inspired) with **strict isolation**. The routing layer is a thin registry; all business logic lives inside `src/features/`.

### Directory Structure

```text
src/
├── components/               # 🧩 GLOBAL UI
│   ├── common/               # Polymorphic wrappers (Box, Heading, Text, PriceText) — use cva + cn()
│   ├── layouts/              # RootLayout, PublicHeader, Footer
│   └── ui/                   # HeroUI re-exports / wrappers with project defaults
│
├── config/                   # ⚙️ GLOBAL SETTINGS (boot-time setup)
│   ├── axios.ts              # Axios instance + interceptors
│   ├── i18n.ts               # react-i18next initialization
│   └── env.ts                # Environment constants
│
├── lib/                      # 🛠️ PURE UTILITIES (no side effects)
│   ├── utils.ts              # cn() — tailwind-merge + clsx
│   └── format.ts             # Currency, date, number formatters (locale-aware)
│
├── middlewares/              # 🛡️ ROUTE GUARDS — called from beforeLoad
│   └── auth.guard.ts         # requireAuth, requireGuest, requireRole
│
├── store/                    # 📦 GLOBAL CLIENT STATE (Zustand)
│   ├── useAuthStore.ts
│   └── useLocaleStore.ts     # (Optional) mirror current locale outside React tree
│
├── types/                    # 🌐 GLOBAL TYPES
│   ├── api.type.ts           # ApiResponse<T>, Pagination, Meta
│   └── models/               # Database entities (User, Game, Product, Transaction)
│
├── locales/                  # 🌐 i18n FILES — one folder per locale, one JSON per namespace
│   ├── id/                   # common, auth, checkout, home, dashboard, admin, errors
│   └── en/
│
├── features/                 # 📦 BUSINESS DOMAINS — strict isolation
│   ├── auth/
│   ├── checkout/
│   ├── home/
│   ├── invoice/
│   ├── member-dashboard/
│   └── admin-dashboard/
│
├── routes/                   # 📍 TANSTACK ROUTER (file-based, registry-only)
│   ├── __root.tsx
│   ├── $locale/
│   │   ├── index.tsx                 # Homepage
│   │   ├── checkout/$gameSlug.tsx    # Single-route checkout SPA
│   │   ├── invoice/$invoiceNumber.tsx
│   │   ├── refund/index.tsx          # Public refund claim (?token= from email, ?invoice= prefill)
│   │   ├── _auth/                    # requireGuest()
│   │   ├── _member/                  # requireAuth({ role: 'member' })
│   │   └── _admin/                   # requireAuth({ role: 'superadmin' })
│   └── index.tsx                     # Catch-all → redirect to /id
│
├── index.css                 # Tailwind v4 entry — @import "tailwindcss" + @theme tokens
└── main.tsx                  # Provider stack — see "Provider Stack" section below
```

> 🚨 **Golden Rule:** A feature inside `src/features/` **MUST NOT** import from another feature. If two features need to share something:
>
> - Shared types (e.g. `User`, `Game`) → promote to `src/types/models/`
> - Shared UI → promote to `src/components/common/`
> - Shared hooks/utils → promote to `src/hooks/` or `src/lib/`

## Routing (TanStack Router — file-based)

- `src/routes/` files are **registry-only** — no JSX. They only import a `component` from `src/features/` and optionally wire `beforeLoad`.
- `src/routeTree.gen.ts` is auto-generated by the TanStack Router Vite plugin — **never edit manually**.
- All user-facing routes live under the `$locale` dynamic segment. The locale value is captured at this level and propagated downstream.
- Route groups by access level:
  - `_auth/` → `beforeLoad: ({ params }) => requireGuest({ locale: params.locale })`
  - `_member/` → `beforeLoad: ({ params }) => requireAuth({ role: 'member', locale: params.locale })`
  - `_admin/` → `beforeLoad: ({ params }) => requireAuth({ role: 'superadmin', locale: params.locale })`

### Middlewares (Route Guards)

`src/middlewares/auth.guard.ts` exports `requireAuth({ role, locale })`, `requireGuest({ locale })`, and `requireRole(role)`. Guards read the token directly from Zustand (`useAuthStore.getState()`) and `throw redirect(...)` on failure.

> **Why `beforeLoad`:** It runs _before_ the component mounts, eliminating the flicker of a brief unauthenticated render. Route protection logic **NEVER** lives inside React components.

## State Management

| Concern               | Tool                                       |
| --------------------- | ------------------------------------------ |
| Server / API data     | TanStack Query (`useQuery`, `useMutation`) |
| Global client state   | Zustand (`src/store/`)                     |
| Local component state | React `useState`                           |

**Rules:**

- Never use Zustand to cache API responses.
- Never use `useEffect` for data fetching — always TanStack Query.
- Query keys follow the pattern: `['feature', 'resource', ...params]` (e.g. `['checkout', 'validate-id', userId, serverId]`).

### Live Invoice Polling Pattern

The invoice tracker uses TanStack Query's `refetchInterval` callback to poll every 5 seconds and auto-stop on terminal status:

```ts
// src/features/invoice/api/useInvoiceQuery.ts
export const useInvoiceQuery = (invoiceNumber: string) =>
  useQuery({
    queryKey: ["invoice", invoiceNumber],
    queryFn: () => fetchInvoice(invoiceNumber),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "success" || status === "failed") return false;
      return 5000;
    },
  });
```

### Real-time Game ID Validation

Use TanStack Query with debounced input (~500ms) to validate Game IDs against the game server and retrieve the player's nickname. Debounce the input value at the hook level, then feed the debounced value into the query key.

## Features (`src/features/[name]/`)

Each feature is self-contained. Internal structure:

```text
features/<name>/
├── api/             # TanStack Query hooks: useXxxQuery, useXxxMutation
├── components/      # Presentational + smart components
├── hooks/           # Non-API hooks (UI logic, derived state, custom listeners)
├── pages/           # Route-level smart components wired to the feature's hooks
├── schemas/         # Zod schemas (form validation)
├── store/           # Feature-scoped Zustand stores (optional — e.g. useCheckoutStore)
└── types/           # Feature-local TS types (NOT global entities)
```

**Important distinctions:**

- `api/` — TanStack Query wrappers (`useLoginMutation`, `useInvoiceQuery`, etc.). Raw axios calls and TanStack Query hooks live **together** here.
- `hooks/` — non-API hooks only (e.g. `useDebouncedValue`, `useCheckoutStep`). Do not put query hooks here.
- `types/` — feature-local types only (e.g. `CheckoutFormData`, `NicknameValidationResponse`). Database entities (`User`, `Game`, `Product`, `Transaction`) go in `src/types/models/`.

Export the feature's public API through `features/<name>/index.ts`.

## HTTP Client (Axios)

`src/config/axios.ts`. The `api` instance attaches the Bearer token from `useAuthStore` on every request, and the response interceptor unwraps to the response body — callers work with the API envelope (`{status, code, message, data}`) directly rather than reaching through `response.data`.

On a `401` outside `/v1/auth/*` it attempts **one** token refresh, replays the original request, and only clears auth + redirects if that fails. The in-flight refresh is shared: without that, a page firing several queries at once would send one refresh per query, the first would rotate the token, and the rest would fail against a token that no longer exists.

A guest whose request happens to 401 is **not** bounced to `/login` — only someone who actually had a session.

On a **503 carrying a `data.licence` block** the site has been switched off from the Uxio Hub (suspended, or its licence lapsed). The interceptor records that in `src/lib/siteClosed.ts` and `SiteClosedGate` renders a notice over the whole app; the next successful response clears it, so the site comes back without a reload. A 503 **without** that block is an ordinary outage — a restarting container, a proxy with nothing behind it — and must not be reported to a customer as a billing problem.

**`SiteClosedGate` and `MaintenanceGate` are different things and must not be merged.** Maintenance is the operator's own flag: it fails open, any signed-in session passes through, and it says "back shortly". The closed gate reflects the *server* refusing every public request, so no session gets past it — because the server is not letting anyone past either. Its copy also stays vague about the reason: a customer has no stake in the shop's billing arrangement, and the site's own admin sees the real message in their panel, which stays reachable.

## API Contract (as-built)

Base URL is `VITE_API_BASE_URL` (stops at `/api`); services add the `/v1` prefix from `API_VERSION` in `src/config/env.ts`. See `.agents/context/system_architecture.md` for the full endpoint table.

Things that bite if you assume otherwise:

- Login/register return an **`access_token` + `refresh_token` pair**, not `token`.
- List endpoints nest the paginator: rows are at `response.data.data`, page info at `response.data.meta`.
- Transaction statuses are the API's **uppercase** enum (`PENDING`, `PAID`, `PROCESSING`, `COMPLETED`, `FAILED_PROVIDER`, `EXPIRED`, `REFUNDED`). Invoice polling stops on the `is_terminal` flag the API returns — don't re-derive it.
- Prices come **pre-resolved for the caller**. There is no tier to pick on the client; queries that return prices are keyed on the user id so login/logout refetches.
- `GET /v1/games/{slug}` returns `order_form_fields`. The checkout account step renders those — it does not hardcode "User ID / Server ID". **A zone is always a free-text numeric input, never a dropdown** (the API deletes seeded zone options on purpose: a picker produced wrong ids that only failed at the supplier, after payment).
- **The account id is verified before the confirmation modal opens.** A game with a lookup provider (`supports_nickname_check`) must have a resolved nickname: "Cek Username" sets it, and pressing "Top Up Sekarang" runs the lookup itself if it has not run for the current id. A rejected id keeps the modal shut. A game with no provider is gated on the `order_form_fields` rules instead. An already-checked id is never looked up twice — some provider lookups are billed per call.
- Nickname validation still degrades to `null` in the *API* sense — the endpoint always 200s, and the account-step line stays hidden until there is a name. What changed is that for a provider-backed game, `null` now blocks checkout rather than passing silently.
- The provider's answer is the raw receipt line (`User ID … / Username EkaNata / Region = ID`); `features/checkout/lib/nickname.ts` trims it to the name for display and for `target_nickname`. It never turns an unrecognised string into `null`.

### Where API code lives

The `auth` feature established `services/` for raw axios calls and `hooks/` for the TanStack Query wrappers, and the newer features follow it (`features/checkout/services` + `hooks`, `features/invoice/services` + `hooks`). This differs from the `api/` folder named in the "Features" section below — follow the code, and if you move one, move them all.

Endpoints used by more than one feature live outside `features/` so the golden rule holds: `src/services/storefront.service.ts` and `src/hooks/useGamesQuery.ts` back the homepage grid, the navbar search and the price-list selector alike.

## Auth Store (`src/store/useAuthStore.ts`)

- Token persisted in cookie (`access_token`) via `js-cookie`.
- Store initializes from the cookie on app load.
- Holds `user` (with `role: 'member' | 'superadmin'`) for role-based guards.
- Public API: `setAuth(token, user, remember?)`, `clearAuth()`, `getRole()`.

Guards (`requireAuth`, `requireRole`) read state via `useAuthStore.getState()` — synchronous access required inside `beforeLoad`.

## Component Hierarchy

- `src/components/ui/` — **HeroUI** re-exports / wrappers with project-specific defaults. No raw business logic.
- `src/components/common/` — Polymorphic wrappers that **replace raw HTML elements**:
  - `<Box>` → `div`, `section`, `article`, `span`, etc.
  - `<Text>` → `p`, `span`
  - `<Heading>` → `h1`–`h6`
  - `<Container>` → centered max-width wrapper
  - `<Image>` → `img`
  - `<Link>` → `a`
  - `<PriceText>` → preset for gradient prices (white → lavender, `font-plex`, `bg-clip-text`)
- `src/components/layouts/` — Global layout wrappers (`RootLayout`, `PublicHeader`, `Footer`).

**ESLint enforces this:** using `<div>` directly is a lint error — use `<Box>` instead.

### HeroUI Override Discipline

HeroUI is the primitive layer for accessible components (Modal, Dropdown, Popover, Input, Button, Tabs, Tooltip). **Always override default theming** via the `classNames` slot API with arbitrary Tailwind values:

```tsx
<Button
  classNames={{
    base: "rounded-[50px] bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary",
    label: "font-outfit font-bold text-[14px] text-[#E9D5FF]",
  }}
>
  Top Up Now
</Button>
```

Do **NOT** rely on HeroUI's `color="primary"` / `variant="solid"` — those defaults will not match the design system.

## Forms

All forms use React Hook Form + `@hookform/resolvers/zod`. Zod schemas live in `features/<name>/schemas/`, TS types in `features/<name>/types/`. No inline validation in components. Infer form types from schemas with `z.infer<typeof schema>`.

## Styling & Design System

**Theme:** Premium e-sports, **Near-Black + Neon Violet** dark mode with glassmorphism + violet–azure gradient signature.

### Core Color Tokens

| Role                  | Value                    | Notes                                                |
| --------------------- | ------------------------ | ---------------------------------------------------- |
| Page background       | `#0A0A0C`                | **Not pure black** — slightly warm; this matters     |
| Primary accent        | `#9234EA` (violet)       | CTA gradient pair                                    |
| Secondary accent      | `#3B82F6` (azure)        | CTA gradient pair                                    |
| Surface (glass)       | `rgba(59,130,246,0.05)`  | Default product card bg                              |
| Surface (white glass) | `rgba(255,255,255,0.05)` | Secondary button bg                                  |
| Active card border    | `#C084FC` (3px)          | Persistent highlight (e.g. featured Flash Sale card) |
| Discount green        | `#0EA42E`                | Discount badge                                       |
| Footer gradient       | `#671EAB → #270A4F`      | Bottom-direction linear                              |

### Typography (4 Families — Strict Role Mapping)

| Family                      | Token         | Role                                                  |
| --------------------------- | ------------- | ----------------------------------------------------- |
| **Outfit**                  | `font-outfit` | Headings, button text, brand labels                   |
| **Inter**                   | `font-inter`  | Body text, descriptions, strikethrough price          |
| **IBM Plex Sans Condensed** | `font-plex`   | **Prices, countdown timers, stock counters** — strict |
| **DM Sans**                 | `font-dmsans` | Product names on cards                                |

> ⚠️ **IBM Plex Sans Condensed is mandatory for every number** (prices, timers, stock). This gives the gaming-grade tabular/digital feel. Do not substitute.

### Signature Patterns

**1. Gradient Price (white → lavender) — mandatory `bg-clip-text` pattern:**

```tsx
<p className="bg-linear-to-r from-white to-[#E9D5FF] bg-clip-text text-transparent font-plex font-bold text-[25px] leading-7">
  Rp 72.500
</p>
```

**2. Violet glow shadow** (timer signature): `0 0 14.87px rgba(147,51,234,0.3)` → exposed as `shadow-glow-violet`.

**3. Glassmorphism cards:** semi-transparent bg + 1px thin border + optional `backdrop-blur-[6px]`.

**4. Active vs Default card variants:** Implement via **CVA** (`class-variance-authority`), NOT via `:hover`. The active state is **persistent** (e.g. the first Flash Sale card is always highlighted).

**5. Two-layer stock bar:** dark track `bg-[#0B051D]` + violet fill `bg-[#9333EA]`, width = `current/total * 100%`.

### Class Collision Prevention

Use `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) for all conditional class merging. For polymorphic components, combine `cn()` with `cva` to expose typed variant props.

## Tailwind v4 Configuration

This project uses **Tailwind CSS v4 exclusively**. There is **NO `tailwind.config.ts` file**. All design tokens are defined via the `@theme` directive in **`src/index.css`** (the CSS entry, imported by `main.tsx`).

```css
/* src/index.css */
@import "tailwindcss";
@plugin "@heroui/theme";

@theme {
  --color-primary: #9234ea;
  --color-azure-60: #3b82f6;
  --color-surface-base: #0a0a0c;
  --color-violet-deep: #0b051d;
  --color-violet-75: #c084fc;
  --color-violet-lavender: #e9d5ff;

  --font-outfit: "Outfit", sans-serif;
  --font-inter: "Inter", sans-serif;
  --font-plex: "IBM Plex Sans Condensed", sans-serif;
  --font-dmsans: "DM Sans", sans-serif;

  --background-image-gradient-cta: linear-gradient(to right, #3b82f6, #9234ea);
  --background-image-gradient-price: linear-gradient(to right, #ffffff, #e9d5ff);
  --background-image-gradient-footer: linear-gradient(to bottom, #671eab, #270a4f);

  --shadow-glow-violet: 0 0 14.87px rgba(147, 51, 234, 0.3);
  --shadow-cta-primary: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

When you need a token, **add it to `@theme` first** — never inline a raw value across multiple files. Arbitrary Tailwind values (e.g. `bg-[#0A0A0C]`) are acceptable for one-off spec values lifted directly from Figma.

## Internationalization (i18n)

### URL-Based Locale Strategy

- **Format:** `/{locale}/...` — locale is the first path segment.
- **Default:** `id`. Root `/` redirects to `/id`.
- **Supported:** `['id', 'en']`. Unknown locale → redirect to `/id`.

### Sync Mechanism

In `__root.tsx`, a `useEffect` reads `params.locale` and calls `i18n.changeLanguage(params.locale)` to sync `react-i18next` with the URL.

### Translation Files

- One folder per locale under `src/locales/{locale}/`.
- One JSON per namespace: `common`, `auth`, `checkout`, `home`, `dashboard`, `admin`, `errors`, `refund`, …
- **A new namespace must be registered in `src/config/i18n.ts` in three places** — the `id` resources map, the `en` resources map, and the `ns` array. Missing the third makes the namespace load lazily and render raw keys on first paint; it is the step that gets forgotten.
- Use `useTranslation('namespace')` or `t('namespace:key')`.

### Rules

- **All UI strings must be wrapped in `t()`** — no hardcoded ID/EN text in components, ever.
- Currency, date, and number formatting goes through `Intl.NumberFormat` / `Intl.DateTimeFormat` with the current locale — centralize in `src/lib/format.ts`.
- Locale switcher in the header replaces the first path segment via `router.navigate({ to: newPath })`, which automatically triggers the `useEffect` above.
- Each locale-prefixed URL is independently indexable — add `<link rel="alternate" hreflang="..." />` on public pages.

## Payment Gateway (Monetapay)

The frontend **NEVER** calls Monetapay directly. All payment communication is proxied through the backend:

```
Frontend  →  Backend (our API)  →  Monetapay
                ↑                       ↓
                └─── webhook ──────────┘
```

- `GET /v1/storefront/payment-channels` — the selectable methods. Prefixed with `/storefront`
  because `/v1/payment-channels` is the admin CRUD route; `balance` is omitted for guests.
- `POST /v1/checkout` — backend creates the transaction *and* the payment, calls Monetapay, and
  returns `payment.instructions` (`qr_string`, `virtual_account`, or `checkout_url`). The same
  instructions are persisted to `payments.payment_data`, so a page refresh can re-render the
  QR/VA instead of leaving the customer with nothing to pay against.
- Webhook → backend updates `transactions.status`. Frontend learns via 5s polling on
  `GET /v1/invoices/{invoice_number}`, stopping on the `is_terminal` flag the API returns
  (see "Live Invoice Polling Pattern" above).

## Provider Stack (`main.tsx`)

Order matters — outer to inner:

```tsx
<React.StrictMode>
  <HeroUIProvider>
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </QueryClientProvider>
  </HeroUIProvider>
</React.StrictMode>
```

Zustand stores do NOT need a provider — they are accessible globally via their hooks.

## Image uploads

The one image upload in this app is the member avatar (`InformasiPribadiCard`). It is re-encoded to WebP by
`src/lib/imageCompression.ts` (quality 0.82, longest edge 1920px, EXIF rotation baked in) **before** the 2 MB
size check, so a multi-megabyte phone photo is accepted rather than rejected — the check has to run on what
actually gets uploaded.

`compressImage` never throws: SVG/ICO/PDF, animated GIFs, already-small WebP, a browser without WebP encoding,
and a result that came out bigger all return the input file untouched. The API re-encodes everything it
receives anyway (`App\Services\ImageOptimizer`), so this is the shortcut, not the guarantee.

The file is a byte-identical copy of the one in `uxiotopup-admin`, where it carries its unit tests (this
repo's vitest runs on `node`, with no canvas to exercise). Change one, change both.

## Definition of Done (Per Feature)

Before considering a feature complete, verify:

- [ ] No cross-feature imports (`grep "from '@/features/<other>'"` returns nothing).
- [ ] All UI strings wrapped in `t()` — no hardcoded ID/EN text.
- [ ] All forms use React Hook Form + Zod resolver.
- [ ] All server state via TanStack Query — no `useEffect + fetch`.
- [ ] All client state via Zustand or local `useState` — no prop-drilling, no global `useState` lifting beyond reason.
- [ ] Route protection (if any) lives in `beforeLoad`, NOT in component body.
- [ ] HeroUI components used for primitives; styling overridden via `classNames` + arbitrary Tailwind values.
- [ ] All prices use the gradient `bg-clip-text` pattern with `font-plex`.
- [ ] All numbers (timers, stock, counters) use `font-plex` (IBM Plex Sans Condensed).
- [ ] Polymorphic components use `cn()` + `cva`.
- [ ] No raw `<div>` / `<p>` / `<h1>` — use `<Box>` / `<Text>` / `<Heading>`.

## Path Alias

`@` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

---

> 🔁 **Final reminder:** This file summarizes _how_ to work in this repo. For _what_ to build and _how it should look_, always cross-check `.agents/context/product_requirements.md`, `.agents/context/design_system.md`, and `.agents/context/system_architecture.md`. When in doubt, **ask before assuming**.

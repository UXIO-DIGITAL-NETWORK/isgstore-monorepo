# System Architecture & Best Practices Brief: UDN Top Up Website

**Target Audience:** Fullstack Developer, Frontend AI Agents
**Architecture Type:** Decoupled SPA (Single Page Application via API)
**Pattern:** Feature-Based Architecture (Bulletproof React inspired)

## 1. Communication Concept (The Bridge)

This project adopts an API-Driven architecture.

- **Backend (REST API):** Acts as the main engine handling core business logic, database interactions, and communication with Third-Party APIs (Game Servers & **Monetapay** Payment Gateway).
- **Frontend (React 19 + TypeScript):** Pure presentation layer and interactive client that relies heavily on the TanStack ecosystem (Router & Query) and Zustand for maximum performance.

### 1.1 Payment Gateway Integration

Payment processing is handled by **Monetapay**, but **only through the backend** — the frontend NEVER calls Monetapay APIs directly. Communication pattern:

```
Frontend  →  Backend (our API)  →  Monetapay
                ↑                       ↓
                └─── webhook ──────────┘
```

- `GET /api/payment-methods?product_id={id}` → backend returns the list of Monetapay-supported methods.
- `POST /api/transactions` → backend creates the local transaction record, calls Monetapay to initialize the payment session, and returns payment instructions (VA, QRIS payload, e-wallet deeplink) to the frontend.
- Monetapay webhook → backend updates `transactions.status`. The frontend learns about state changes via **5-second polling** on `GET /api/invoices/{invoice_number}`.

## 2. The Golden Rule of Frontend Architecture

This application strictly separates foundation/global code from specific business domain code.

> 🚨 **CRITICAL RULE:** A feature (inside the `src/features/` folder) **MUST NOT** import anything directly from another feature. Every feature domain must be completely standalone and decoupled.

If two features need to share something:

- **Shared types (e.g. `User`, `Game`)** → promote to `src/types/models/`.
- **Shared UI components (e.g. `<GameCard>`)** → promote to `src/components/common/`.
- **Shared hooks/utilities** → promote to `src/lib/` or `src/hooks/`.

## 3. Directory Structure

The directory structure is designed to prevent redundancy and confusion between _Global State/Types_ and _Local Feature Logic_.

```text
src/
├── components/               # 🧩 GLOBAL UI COMPONENTS
│   ├── common/               # Polymorphic custom components (Box, Heading, Text, PriceText). Must use cva & cn().
│   ├── layouts/              # Global layout wrappers (RootLayout, PublicHeader, Footer).
│   └── ui/                   # HeroUI re-exports / wrappers with project-specific defaults.
│
├── config/                   # ⚙️ GLOBAL SETTINGS
│   ├── axios.ts              # Axios instance + interceptors (JWT injection, 401 handling).
│   ├── i18n.ts               # react-i18next initialization (resources, namespaces, fallback).
│   └── env.ts                # Environment constants (API_URL, etc).
│
├── lib/                      # 🛠️ PURE UTILITIES
│   ├── utils.ts              # `cn()` (tailwind-merge + clsx).
│   └── format.ts             # Currency, date, number formatters (locale-aware).
│
├── middlewares/              # 🛡️ ROUTE GUARDS
│   └── auth.guard.ts         # requireAuth, requireGuest, requireRole — called from beforeLoad.
│
├── store/                    # 📦 GLOBAL CLIENT STATE (Zustand)
│   ├── useAuthStore.ts       # JWT token, user info, login/logout actions.
│   └── useLocaleStore.ts     # (Optional) Current locale mirror — useful when needed outside React tree.
│
├── types/                    # 🌐 GLOBAL TYPES
│   ├── api.type.ts           # Common API response types (ApiResponse<T>, Pagination, Meta).
│   └── models/               # Database entity representations
│       ├── User.ts
│       ├── Game.ts
│       ├── Product.ts
│       └── Transaction.ts
│
├── locales/                  # 🌐 i18n TRANSLATION FILES
│   ├── id/                   # Indonesian (default)
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── checkout.json
│   │   ├── home.json
│   │   ├── dashboard.json
│   │   ├── admin.json
│   │   └── errors.json
│   └── en/                   # English
│       ├── common.json
│       └── ... (same namespaces)
│
├── features/                 # 📦 BUSINESS DOMAINS — strict isolation
│   ├── auth/                 # Login/register forms, JWT mutations, local Zod schemas
│   │   ├── api/              # useLoginMutation, useRegisterMutation, useLogoutMutation
│   │   ├── components/       # LoginForm, RegisterForm
│   │   ├── schemas/          # loginSchema.ts, registerSchema.ts (Zod)
│   │   └── types/            # LoginPayload, RegisterPayload (feature-local types)
│   │
│   ├── checkout/             # Single-route checkout flow (game info + form + nominal + payment)
│   │   ├── api/              # useValidateGameIdQuery (debounced), useCreateTransactionMutation, usePaymentMethodsQuery
│   │   ├── components/       # GameIdForm, NicknameDisplay, NominalGrid, PaymentMethodSelector, CheckoutSummary
│   │   ├── schemas/          # checkoutFormSchema.ts (Zod)
│   │   ├── store/            # useCheckoutStore (Zustand: selected product, payment method, step)
│   │   └── types/            # CheckoutFormData, NicknameValidationResponse
│   │
│   ├── home/                 # Homepage display
│   │   ├── api/              # useFlashSaleQuery, usePopularGamesQuery, useAllGamesQuery
│   │   └── components/       # FlashSaleSection, GameCard (active/default), PopularSection, HeroBanner, CategoryTabs
│   │
│   ├── invoice/              # Live invoice tracker (public)
│   │   ├── api/              # useInvoiceQuery (with 5s polling, auto-stop on terminal status)
│   │   └── components/       # InvoiceStatusBadge, PaymentInstructions, InvoiceDetails
│   │
│   ├── member-dashboard/     # Member-only: transaction history, contact book
│   │   ├── api/
│   │   ├── components/
│   │   └── types/
│   │
│   └── admin-dashboard/      # Super Admin: metrics, games CRUD, products CRUD
│       ├── api/
│       ├── components/
│       └── types/
│
├── routes/                   # 📍 TANSTACK ROUTER ENTRY POINTS (file-based)
│   ├── __root.tsx            # Root layout — i18n initialization, providers
│   ├── $locale/              # Locale-prefixed dynamic segment
│   │   ├── index.tsx         # Homepage (/id, /en)
│   │   ├── checkout/
│   │   │   └── $gameSlug.tsx # /id/checkout/mobile-legends — single-route checkout flow
│   │   ├── invoice/
│   │   │   └── $invoiceNumber.tsx
│   │   ├── _auth/            # Route group guarded by requireGuest()
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── _member/          # Route group guarded by requireAuth({ role: 'member' })
│   │   │   └── dashboard/
│   │   │       ├── index.tsx
│   │   │       ├── history.tsx
│   │   │       └── contacts.tsx
│   │   └── _admin/           # Route group guarded by requireAuth({ role: 'superadmin' })
│   │       ├── index.tsx
│   │       ├── games.tsx
│   │       └── transactions.tsx
│   └── index.tsx             # Catch-all: redirect to /id (default locale)
│
└── main.tsx                  # React 19 entry — Providers stack: HeroUIProvider, QueryClientProvider, RouterProvider, I18nextProvider
```

## 4. Frontend Best Practices (Strict Guidelines for AI & Developers)

### 4.1 Typing Strategy

- **Global Models:** Entities used in more than one feature (such as `User`, `Game`, `Product`, `Transaction`) **MUST** be stored in `src/types/models/`. Never store global entities inside a specific feature folder.
- **Feature-Specific Types:** Data types used exclusively by a single feature (e.g., `LoginPayload`, `CheckoutFormData`, `NicknameValidationResponse`) **MUST** be placed within their respective feature folders (e.g., `src/features/auth/types/`).
- **API Response Wrapping:** All API responses use the generic shape defined in `src/types/api.type.ts`:

  ```ts
  export interface ApiResponse<T> {
    data: T;
    message: string;
    meta?: PaginationMeta;
  }
  ```

### 4.2 Routing & Route Protection (Auth Guards)

- **Type-Safe Routing:** ALWAYS use **TanStack Router**. Navigation must be strictly validated by TypeScript via the generated `routeTree.gen.ts`.
- **File-Based Routing with Locale Prefix:** All user-facing routes live under the `$locale` dynamic segment. The locale value is captured at this level and propagated downstream.
- **Middleware Pattern:** Do not place route protection logic (redirects) inside React UI components. Protection functions like `requireAuth()`, `requireRole()`, and `requireGuest()` should read the token directly from Zustand (`useAuthStore.getState()`) and be injected **exclusively** into the `beforeLoad` property of the route definition files.

  ```ts
  // Example: src/routes/$locale/_member/dashboard/index.tsx
  export const Route = createFileRoute("/$locale/_member/dashboard/")({
    beforeLoad: ({ params }) => requireAuth({ role: "member", locale: params.locale }),
  });
  ```

- **Why `beforeLoad`:** It runs _before_ the component mounts, eliminating the "flicker" of a brief unauthenticated render before redirect. It's also synchronous-throwing-friendly (`throw redirect({ to: '/login' })`).

### 4.3 UI Components & Styling (Tailwind Collision Prevention)

- **Tailwind Usage:** Use **Tailwind CSS v4** utility classes — configured via `@theme` directive in `src/styles/globals.css`. There is no `tailwind.config.ts`.
- **HeroUI as Primitive Layer:** All accessible primitives (Modal, Dropdown, Popover, Input, Button, Tabs, Tooltip) use **HeroUI** components. Visual styling is overridden via Tailwind arbitrary values + HeroUI's `classNames` slot API.
- **Polymorphic Components:** For custom abstract components (such as `<Box>`, `<Heading>`, `<Text>`, `<PriceText>`), developers **MUST** use class merging utility functions like `tailwind-merge` and `clsx` (usually combined into `cn()`) alongside `cva` (Class Variance Authority). This is critical to prevent CSS class collisions between default component classes and classes passed via the `className` prop.

  ```ts
  // src/lib/utils.ts
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";

  export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
  ```

### 4.4 State & Form Management (Separation of Concerns)

- **Server State:** Fetching and mutating data to the API is handled exclusively by **TanStack Query** (`useQuery`, `useMutation`). Define query keys consistently: `['feature', 'resource', ...params]` (e.g., `['checkout', 'validate-id', userId, serverId]`).
- **Client State:** Use **Zustand** exclusively for UI states that are not derived from the database or global server state (such as auth token, checkout step, selected product).
- **Form Handling:** All forms in the application **MUST** use **react-hook-form** integrated with `@hookform/resolvers/zod`. Zod schemas prevent the submission of dirty or invalid API payloads.

### 4.5 Live Invoice Polling Pattern

The live invoice tracker uses TanStack Query's `refetchInterval` callback to automatically stop polling on terminal status:

```ts
// src/features/invoice/api/useInvoiceQuery.ts
export const useInvoiceQuery = (invoiceNumber: string) =>
  useQuery({
    queryKey: ["invoice", invoiceNumber],
    queryFn: () => fetchInvoice(invoiceNumber),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling once status is terminal
      if (status === "success" || status === "failed") return false;
      return 5000; // 5 seconds
    },
  });
```

## 5. Internationalization (i18n) Architecture

### 5.1 Library Stack

- **`react-i18next`** — primary i18n binding for React.
- **`i18next`** — core engine.
- **`i18next-browser-languagedetector`** — fallback detection (browser language) if URL has no locale prefix.
- **`i18next-http-backend`** _(optional)_ — lazy-load translation namespaces. For an MVP-scale app, statically bundled JSON imports are fine.

### 5.2 URL-Based Locale Strategy

- **Format:** `/{locale}/...` — locale is the first path segment (e.g. `/id/checkout/mobile-legends`, `/en/dashboard`).
- **Default Locale:** `id` (Indonesian). The root route `/` redirects to `/id`.
- **Supported Locales:** `['id', 'en']`. Any other locale in the URL → redirect to default.
- **Sync Mechanism:** At the root route, a `useEffect` reads `params.locale` and calls `i18n.changeLanguage(params.locale)` to sync `react-i18next` with the URL.

  ```tsx
  // src/routes/__root.tsx (conceptual)
  function RootComponent() {
    const { locale } = useParams({ strict: false });
    const { i18n } = useTranslation();
    useEffect(() => {
      if (locale && i18n.language !== locale) {
        i18n.changeLanguage(locale);
      }
    }, [locale, i18n]);
    return <Outlet />;
  }
  ```

### 5.3 Translation File Organization

- One folder per locale under `src/locales/{locale}/`.
- One JSON file per namespace (`common.json`, `auth.json`, `checkout.json`, etc.).
- Namespaces map to feature folders — keep translation keys close in concept to the feature that uses them.
- Use the `t('namespace:key')` or `useTranslation('namespace')` pattern for clarity.

### 5.4 Locale Switcher Behavior

- Header switcher (HeroUI `<Dropdown>`) calls a helper that:
  1. Reads the current TanStack Router location.
  2. Replaces the first path segment with the new locale.
  3. Navigates to the new URL via `router.navigate({ to: newPath })`.
- This automatically triggers the `useEffect` in step 5.2, which calls `i18n.changeLanguage(...)`.

### 5.5 Formatting Rules

- **Currency:** All prices formatted via `Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR' })`. Centralize in `src/lib/format.ts`.
- **Dates:** Use `Intl.DateTimeFormat(locale, ...)` for transaction timestamps in dashboards.
- **Numbers (counters, stock):** Use `Intl.NumberFormat(locale)` for proper thousand separators.

### 5.6 SEO Considerations (Public Pages)

- Add `<link rel="alternate" hreflang="id" href="..." />` and `hreflang="en"` on every public page (homepage, game pages, checkout) via `react-helmet-async` or TanStack Router's `head` API.
- Each locale URL must be independently crawlable and indexable.

## 6. Provider Stack (Application Bootstrap)

The provider order in `main.tsx` must follow this hierarchy (outer to inner):

```tsx
<React.StrictMode>
  <HeroUIProvider>
    {" "}
    {/* UI library */}
    <QueryClientProvider client={qc}>
      {" "}
      {/* Server state */}
      <I18nextProvider i18n={i18n}>
        {" "}
        {/* Translations */}
        <RouterProvider router={router} />
        {/* Routing — must be innermost */}
      </I18nextProvider>
    </QueryClientProvider>
  </HeroUIProvider>
</React.StrictMode>
```

Zustand stores do NOT need a provider — they are accessible globally via their hooks.

## 7. Definition of Done Checklist (Per Feature)

Before considering a feature "done", verify:

- [ ] No cross-feature imports (`grep "from '@/features/<other>'"` returns nothing).
- [ ] All UI strings wrapped in `t()` (no hardcoded ID/EN text).
- [ ] All forms use react-hook-form + Zod resolver.
- [ ] All server state via TanStack Query (no `useEffect + fetch`).
- [ ] All client state via Zustand (no prop-drilling, no global `useState` lifting beyond reason).
- [ ] Route protection (if any) lives in `beforeLoad`, NOT in component body.
- [ ] HeroUI components used for primitives; styling overridden via `classNames` + arbitrary Tailwind values.
- [ ] All prices use the gradient `bg-clip-text` pattern with `font-plex`.
- [ ] Polymorphic components use `cn()` + `cva`.

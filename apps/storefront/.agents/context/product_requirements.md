# Product Requirements Document (PRD): UDN Top Up Website

**Platform:** Web Application (Responsive SPA, Desktop-First)
**Tech Stack:** Laravel / Node.js (Backend), React 19 + TypeScript (Frontend), MySQL/PostgreSQL (Database), Tailwind CSS v4 + **HeroUI** (Styling & UI Component Library).
**Payment Gateway:** Monetapay
**Internationalization:** `react-i18next` with URL-based locale routing (default: `id`)

## 1. Product Overview

This application is an _in-game currency_ (top-up) purchasing platform for various games (Multi-game). The main selling point of this platform is the ease and speed of transactions; users can instantly make purchases simply by entering their Game ID without being required to register or log in (Guest Checkout).

To maintain user retention, the system still provides Registration and Login features for users who want to permanently track their transaction history or gain member benefits (optional).

The platform supports **multi-language (i18n)** with Indonesian (`id`) as the default locale and English (`en`) as the secondary locale. Locale is reflected in the URL (e.g. `/id/checkout/mobile-legends`, `/en/checkout/mobile-legends`) for SEO benefits on public pages.

## 2. User Personas & Roles

**A. Super Admin**

- **Description:** Platform owner or manager.
- **Access Rights:** Has full access to the platform's main backend dashboard.
- **Main Tasks:** Add/edit the list of games, manage currency nominals (products), monitor all incoming transactions, and manage payment method integrations.
- **Database Representation:** A record exists in `users` table with `role = 'superadmin'`.

**B. Guest User (Non-Logged-in User)**

- **Description:** Casual users (primary clients) who want to perform a quick top-up.
- **Access Rights:** Can only access the homepage, checkout, and invoice tracking pages. Cannot view other users' data under any circumstances.
- **Main Tasks:** Select games, validate IDs, checkout, and pay for orders.
- **Database Representation:** **No record** in the `users` table. Transactions created by guest users have `transactions.user_id = NULL`. They are identified only by WhatsApp number on their transactions and can track orders via the invoice number.

**C. Registered User (Member)**

- **Description:** Users who have registered an account on the platform.
- **Access Rights:** Has access to a personal Member Dashboard page.
- **Main Tasks:** View complete transaction history and save Game IDs (Contact Book) to avoid re-typing during future purchases.
- **Database Representation:** A record exists in `users` table with `role = 'member'`.

## 3. System Workflows

**Workflow 1: Quick Purchase / Guest Checkout (Primary)**

This flow lives in a **single SPA route** (`/{locale}/checkout/$gameSlug`). All steps occur within the same page without navigation between separate URLs — state transitions are handled by Zustand + conditional rendering.

1. User selects a game from the homepage and is directed to the checkout page (`/{locale}/checkout/$gameSlug`).
2. The same page displays game information AND the checkout form (no separate "game details" route).
3. User fills in the User ID & Server ID form.
4. The system validates the account in real-time against the game server (via debounced API call) and retrieves the player's _Nickname_.
5. User selects the currency nominal from the interactive grid display.
6. Selects a payment method (Cash / E-Wallet / QRIS) — list dynamically fetched from backend (Monetapay-supported methods).
7. Enters a WhatsApp number and promo code (if any).
8. User clicks the "Pay Now" button.
9. Backend creates a transaction record and initiates payment via **Monetapay**. Frontend redirects to the invoice tracker page (`/{locale}/invoice/$invoiceNumber`).
10. The invoice page displays payment instructions and monitors the status with **live polling every 5 seconds**. Polling stops once the status becomes `success` or `failed`. Items are automatically added to the game upon successful payment (backend webhook from Monetapay → database update).

**Workflow 2: Member Registration & Login**

1. User goes to the Sign Up page (`/{locale}/register`).
2. Fills in account credentials: Name, Email, WhatsApp, Password.
3. The system saves the User data with `role = 'member'`.
4. Upon login, the user is redirected to the Member Dashboard (`/{locale}/dashboard`) to view transaction history or save game profiles.

**Workflow 3: Locale Switching**

1. User clicks the language switcher in the header (shows current flag + locale code, e.g. "🇮🇩 ID").
2. User selects target locale (`id` or `en`).
3. Application navigates to the same logical route under the new locale prefix (e.g. `/id/checkout/mobile-legends` → `/en/checkout/mobile-legends`).
4. All UI strings are re-rendered via `react-i18next` translation keys.

## 4. Detailed Feature Specs

**Module 1: Catalog & Transactions (Global)**

- **Game List Grid:** Displays available games with a search feature.
- **Cashier / POS Interface (Checkout SPA):** Interactive interface without page reloads. State management for nominal selections and payment methods is handled using **Zustand**. Form validation (User ID, WA) is strictly managed using **react-hook-form + Zod**.
- **Real-time Nickname Validation:** Uses **TanStack Query** to call the ID validation API asynchronously (with a _debounce_ of ~500ms to avoid spamming the game server).
- **Live Invoice Tracker:** Payment status checking via TanStack Query polling. **Interval: 5000ms (5 seconds)**. Polling auto-stops when the transaction status becomes terminal (`success` or `failed`). Implemented via `refetchInterval` callback that returns `false` for terminal states.
- **Payment Gateway:** **Monetapay**. The frontend never calls Monetapay directly; the backend acts as a proxy/middleman:
  - `GET /v1/payment-channels` → active methods for the caller (`balance` is member-only).
  - `POST /v1/checkout` → backend creates the transaction, initializes the Monetapay session, and returns payment instructions (VA number, QRIS payload, or checkout link).
  - Monetapay webhook → backend updates `transactions.status`. The frontend learns about this via its 5-second polling on `GET /v1/invoices/{invoice_number}`.

> **As-built note.** The endpoint names above were corrected to match the Laravel API actually in this repo; see `system_architecture.md` for the full table. Real-time nickname validation exists as `POST /v1/games/{slug}/validate-id`, but it **degrades gracefully**: most games have no lookup provider configured, and it returns `nickname: null` rather than blocking the purchase.

**Module 2: Authentication & Security**

- **Register & Login:** Uses a Token / JWT system.
- **Protection Middleware:** _Route Guards_ in **TanStack Router** (`beforeLoad` hook) to prevent Guest Users from accessing the Member Dashboard or Admin Dashboard, and vice versa. Route protection logic NEVER lives inside React components.
- **Role-based Access:**
  - `requireAuth({ role: 'member' })` → `_member/` route group.
  - `requireAuth({ role: 'superadmin' })` → `_admin/` route group.
  - `requireGuest()` → `_auth/` route group (login/register pages, redirected away if already logged in).

**Module 3: Super Admin Dashboard**

- **Overview Metrics:** Displays statistics cards: Total Transactions, Total Revenue, Success/Failed Transactions.
- **Game & Product Management:** CRUD operations for game data and top-up price nominals.

**Module 4: Internationalization (i18n)**

- **Library:** `react-i18next` + `i18next-browser-languagedetector` + `i18next-http-backend` (lazy-load translation namespaces).
- **Supported Locales:** `id` (default), `en`.
- **URL Strategy:** Locale is prefixed in the URL (e.g. `/id/...`, `/en/...`). The locale segment is captured at the root route and injected into i18next via `useEffect` in `__root.tsx`.
- **Fallback Behavior:** If the URL contains an unsupported locale or no locale at all, redirect to `/id/...`.
- **Translation Namespaces (planned):** `common`, `auth`, `checkout`, `home`, `dashboard`, `admin`, `errors`.
- **SEO Consideration:** Each locale-prefixed URL is independently indexable. Add `<link rel="alternate" hreflang="..." />` tags on public pages.

---

## 5. Database Schema & Migration Brief

**Target Audience:** Backend Developer, Database Administrator
**Database System:** MySQL / PostgreSQL

### Table Specifications

**A. users table**

- `id`: bigint, Primary Key, Auto-increment
- `name`: string
- `email`: string, Unique
- `phone_number`: string, Nullable
- `password`: string (hashed)
- `role`: enum or string, values: `['superadmin', 'member']`, Default: `'member'`
- `timestamps()`

> **Note:** Guest users do NOT have a record in this table. They are identified by `transactions.whatsapp_number` and `transactions.invoice_number` on the transaction itself.

**B. games table**

- `id`: bigint, Primary Key, Auto-increment
- `name`: string
- `slug`: string, Unique (for URL routing — e.g. `mobile-legends`, `roblox`)
- `publisher`: string, Nullable
- `thumbnail_url`: string
- `has_server_id`: boolean, Default: false
- `is_active`: boolean, Default: true
- `timestamps()`

**C. products table**

- `id`: bigint, Primary Key, Auto-increment
- `game_id`: foreignId, reference to `games(id)`, cascadeOnDelete
- `name`: string
- `price`: decimal(15, 2)
- `timestamps()`
- `softDeletes()`

**D. transactions table**

- `id`: bigint, Primary Key, Auto-increment
- `invoice_number`: string, Unique (publicly shareable identifier, used in `/invoice/$invoiceNumber` URL)
- `user_id`: foreignId, reference to `users(id)`, **nullable** (NULL = guest checkout)
- `game_id`: foreignId, reference to `games(id)`
- `product_id`: foreignId, reference to `products(id)`
- `target_user_id`: string (the Game ID entered by the buyer)
- `target_server_id`: string, nullable
- `target_nickname`: string, nullable (populated after real-time validation)
- `whatsapp_number`: string
- `total_amount`: decimal(15, 2)
- `payment_method`: string (e.g. `qris`, `ovo`, `gopay`, `dana` — provided by Monetapay)
- `monetapay_reference`: string, nullable (external Monetapay transaction ID for reconciliation)
- `status`: enum or string, values: `['pending', 'processing', 'success', 'failed']`, Default: `'pending'`
- `timestamps()`

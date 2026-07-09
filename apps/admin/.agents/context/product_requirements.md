# Product Requirements Document (PRD): UDN Admin Dashboard

> **Source of truth for _what_ we build.** Every agent MUST read this before any task.
> Precedence when documents conflict: `system_architecture.md` → `product_requirements.md` → `design_system.md` → `CLAUDE.md`.

---

## 0. Document Status & Scope Guardrails

- **Product:** UDN Admin Dashboard — an internal back-office SPA for operators to manage the UDN multi-game top-up platform (data management, financial oversight, transaction operations).
- **Relationship to the consumer platform:** This admin app runs against a **separate backend/service** from the public "UDN Top Up Website". It does **not** share the consumer frontend, and the two apps are decoupled. Do **not** assume a shared database or import consumer code.
- **Backend status:** The admin API is **not built yet**. This phase is **UI-first** — we build fully typed screens backed by local, typed mock fixtures behind a stable service interface, so the swap to real HTTP calls later is a one-file change per service (see `system_architecture.md §6`).
- **Language:** English-only for MVP. No i18n layer is installed (`react-i18next` is intentionally absent). This may be revisited post-MVP.
- **Non-goals this phase:** Real API integration, 2FA, multi-role RBAC UIs, S3/cloud uploads, websockets/real-time push, content/promo/product CRUD.

---

## 1. Product Overview

UDN Admin Dashboard gives a single operator ("Super Admin") a monochrome, data-dense control surface to:

- **Monitor** platform health at a glance — balances (Credit/Debit), daily sales, revenue vs. net income trends, pending order queues, and recent operational activity.
- **Oversee finances** — aggregate money movement, revenue/net-income reporting over time, and exportable financial recaps.
- **Operate transactions** — search, filter, and inspect every top-up transaction, and act on it (status override, refund, re-trigger provider callback, resend receipt, export, and daily/monthly recaps).

The design language is **pure black-and-white (shadcn `neutral`)**, prioritizing scanability and density over decoration. See `design_system.md`.

### 1.1 Success Criteria (MVP)

- All three MVP areas (Dashboard, Finance, Transaction) are navigable, pixel-faithful to Figma, fully typed, and behave correctly against typed mock data.
- Zero TypeScript errors, zero cross-feature imports, zero raw hex (tokens only).
- Every list/table screen is built server-side-ready (pagination/filter/sort params), so wiring the real API requires no component rewrites.
- Light + dark themes both render correctly (dark is default).

---

## 2. Users & Roles

### 2.1 Personas

| Persona | Description | Primary needs |
| --- | --- | --- |
| **Super Admin** | The only role in MVP. Internal operator with full access to every feature. | Fast oversight, reliable transaction operations, trustworthy financial numbers. |

### 2.2 Authorization model (scaffold now, expand later)

- MVP ships a **single role: `super-admin`**, which holds **all permissions** (wildcard).
- Even though only one role exists, the **permission infrastructure is built now** so future roles (e.g. Finance, Content Editor) drop in without refactors:
  - The auth response is expected to carry `roles: string[]` and `permissions: string[]`.
  - Route protection uses `requirePermission(permission)` in `beforeLoad`.
  - Conditional UI uses a `<Can permission="…">` component / `useCan()` hook.
  - Details in `system_architecture.md §5`.
- **Session:** token-based (Bearer). **"Remember me"** is required — it extends cookie expiry (see architecture). **2FA is deferred** to a later phase (the user entity already reserves 2FA fields).

---

## 3. Information Architecture & Navigation

The left sidebar is grouped. The full IA below is the target structure; **only the MVP-scoped items are implemented this phase** — the rest are placeholders/roadmap and should render a lightweight "coming soon" state (or be route-guarded off) rather than broken screens.

| Group | Item | Route (indicative) | Phase |
| --- | --- | --- | --- |
| **General** | Dashboard | `/dashboard` | **MVP** |
| | Reports | `/reports` | Near-term |
| | Financial | `/financial` | **MVP** |
| | Integration | `/integration` | Roadmap |
| **Orders** | Transaction | `/transactions` | **MVP** |
| | Activity | `/activity` | Near-term |
| **Products & Services** | Category | `/categories` | Roadmap |
| | Product | `/products` | Roadmap |
| | Payment | `/payments` | Roadmap |
| | Membership | `/memberships` | Roadmap |
| **Marketing & Content** | Promo | `/promos` | Roadmap |
| | Flash Sale | `/flash-sales` | Roadmap |
| | Website Content | `/content` | Roadmap |
| | Pages | `/pages` | Roadmap |

Global chrome (top bar): global search, support/help, language/utility action, **theme toggle (light/dark)**, notifications, and the user menu (avatar + name + email + dropdown → profile/logout).

---

## 4. MVP Feature Specs

### 4.1 Dashboard (`/dashboard`)

The landing screen. Composed of the following regions (all read-only in MVP, fed by mock data):

1. **Welcome banner** — greeting with the operator's name and the current date, e.g. "Welcome, {name}!" / "It's {weekday}, {date}".
2. **Balance stat cards (×3)** — `Credit`, `Debit`, `Today's Sales`. Each shows:
   - A label, a large currency value (IDR, formatted `Rp 15.231,89`, rendered with tabular figures), a "Since last month" caption, and a **trend pill** (percentage delta with direction, green = up / red = down).
3. **Monthly Performance chart** — an area chart plotting **Revenue** and **Net Income** across days of a selected month; includes a **month selector** and a legend. Caption: "Daily revenue movement, taller areas indicate days with the best revenue."
4. **Pending Orders panel** — a compact list with counts: `Manual Orders`, `Pending Payment`, `Processing`, `Failed Transaction`, plus a "Show More" affordance.
5. **Recent Log Activity panel** — a feed of recent operator/system actions (actor avatar, action label, "By {actor} as {role}", relative timestamp), plus "Show More".
6. **Performance table (tabbed)** — tabs: `Category Performance`, `Product Performance`, `User Performance`, with a range selector ("This Week"). Columns: entity (avatar + name + sub-label, e.g. `Mobile Legend Indonesia` / `Moonton`), `Total Transaction`, `Revenue`.

> All numeric values use tabular figures; all money uses the shared IDR formatter (`src/utils/`). No hardcoded colors — trend pills use the `success`/`destructive` tokens.

### 4.2 Finance / Financial (`/financial`)

Financial oversight built around the platform's money movement. Because the platform supports **both a user wallet/balance and one-off purchases**, finance surfaces both flows.

**Screens/sections to build (data shapes provisional pending API):**

- **Financial overview** — aggregate cards for total **Credit**, total **Debit**, **Net**, and current **Platform Balance**, each with period-over-period trend pills.
- **Revenue vs. Net Income report** — time-series (reuse the dashboard chart component) with range filters (day/week/month/custom) and breakdowns.
- **Credit/Debit ledger** — a server-side data table of balance movements (date, type `credit|debit`, source/reference, amount, running balance, status), filterable and exportable.
- **Export** — CSV/Excel export of the current filtered view.

> Precise financial business rules (settlement, payouts, fee accounting) are **TBD pending backend definition**. Build the **screens and typed data shapes**; do not invent settlement logic. Flag any assumption in `PLAN.md §Open Decisions`.

### 4.3 Transaction (`/transactions`)

The operational core. A **server-side-ready** transaction list plus a rich detail view with operator actions.

**List view**
- A **data table** with **server-side pagination, filtering, and sorting** (params sent to the API; Laravel-paginator response shape — see `system_architecture.md §1`).
- Suggested columns: transaction ID/invoice, date/time, customer (user or guest), game & product/nominal, payment method/channel, amount, status (badge), and a row action menu.
- Filters: status, date range, game/product, payment channel, search (ID/customer). Sort: date, amount, status.
- Bulk affordance: **export CSV/Excel** of the current filtered result set.

**Detail view**
- Full transaction record: identifiers, timeline/status history, customer info (or guest), line item (game → product/nominal), pricing (amount; cost/margin where available), payment channel, and provider references.

**Operator actions (all required this phase — UI + wired to typed service stubs):**
- **Manual status override** — set a transaction's status (e.g. mark `success`/`failed`) with a confirmation dialog.
- **Refund** — initiate a refund (confirmation + reason).
- **Re-trigger provider callback** — re-fire the upstream provider callback for stuck transactions.
- **Resend receipt** — resend the transaction receipt to the customer.
- **Export** — download the transaction (or filtered set) as CSV/Excel.

**Recap**
- A **transaction recap** report: daily and monthly summaries, downloadable, with **breakdown per game / product / payment channel** (totals, counts, revenue). This is the concrete meaning of "rekap transaksi".

> Destructive/irreversible actions (refund, status override) MUST use a confirmation step and surface success/failure via toasts (`sonner`). Actions are permission-gated via `<Can>` even though Super Admin holds all permissions today.

---

## 5. Roadmap (Post-MVP Modules)

Documented so architecture and navigation accommodate them; **not built this phase.**

- **Product management** — `Game → hasMany Product (nominal)`. Each product stores **cost price + selling price** (admin sees margin), an upstream **provider/SKU mapping**, and an **availability toggle**. Categories group games/products.
- **Promo management** — promo **types** (percentage / fixed amount / special price); **scope** (global / per-game / per-product / per-payment-method); **quota** (total + per-user); **validity window**; **minimum purchase**; optional tie-in to a consumer homepage promo banner. Flash Sale is a time-boxed variant.
- **Content / Website Content** — manage consumer homepage content: hero/CTA banners, articles/blog, "Game Populer", testimonials, payment-method logos, footer. **Pages** for static content.
- **Payment methods** — enable/disable channels, configure fees (gateway is backend-proxied on the consumer side).
- **Users (customers)** — manage the consumer platform's end-users: profile, **wallet/balance** (top-up/adjust), transaction history, suspend/ban. Guests have no user record (one-off purchases).
- **Membership** — tiering/loyalty (scope TBD).
- **Settings / SEO**, **Integration**, **Audit Logs**, and **Reports** (dedicated reporting hub).
- **Security** — **2FA (TOTP)** for admin login.

---

## 6. Core Data Entities (Provisional)

Backend is not built; these are **FE-facing entity briefs** to shape typed models and mock fixtures. They live in `src/types/models/` (global) or the owning feature's `types/` (feature-specific). Treat all fields as provisional and revise when the API contract lands.

- **AdminUser** — `id`, `name`, `email`, `avatar_url?`, `roles: string[]`, `permissions: string[]`, `email_verified_at`, `two_factor_confirmed_at` (reserved), `created_at`, `updated_at`.
- **Transaction** — `id`, `invoice_no`, `status` (`pending | processing | success | failed | refunded | …`), `customer` (user ref or guest snapshot, `user_id: number | null`), `game` ref, `product` ref (nominal), `amount`, `cost?`, `margin?`, `payment_channel`, `provider_ref?`, `status_history[]`, `created_at`, `updated_at`.
- **BalanceMovement (ledger)** — `id`, `type` (`credit | debit`), `amount`, `running_balance`, `source`/`reference`, `status`, `created_at`.
- **Game** — `id`, `name`, `publisher`, `image_url`, `is_active` (referenced by transactions/dashboard).
- **Product (nominal)** — `id`, `game_id`, `name`, `cost_price`, `selling_price`, `provider_sku?`, `is_available` (referenced; full CRUD is roadmap).
- **DashboardSummary / FinanceSummary** — aggregate view-models for the stat cards and charts (not raw tables): totals, trend deltas, time-series points.

Shared API envelopes (single vs. list) are defined in `system_architecture.md §1`.

---

## 7. Non-Functional Requirements & Constraints

- **UI-first, swappable data:** components consume typed service hooks (TanStack Query); services are backed by mock fixtures now and real HTTP later, behind an unchanged interface.
- **Server-side tables:** every large list (transactions, ledger) is paginated/filtered/sorted server-side (params → API), typed against the Laravel-paginator response shape.
- **Uploads:** later modules use **multipart to the backend** (no S3 yet).
- **Real-time:** where freshness matters (e.g. transaction status), use **TanStack Query polling** (`refetchInterval`) that stops on terminal states — no websockets this phase.
- **Design fidelity:** monochrome shadcn `neutral`; Inter for all text; tokens only (no raw hex); light + dark (dark default). See `design_system.md`.
- **Accessibility:** WCAG AA contrast, keyboard-navigable tables/menus/dialogs, visible focus rings.
- **Definition of Done:** per `system_architecture.md §7`.

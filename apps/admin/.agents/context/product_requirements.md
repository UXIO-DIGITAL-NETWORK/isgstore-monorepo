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

| Persona         | Description                                                                | Primary needs                                                                   |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
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

| Group                   | Item            | Route (indicative) | Phase                                   |
| ----------------------- | --------------- | ------------------ | --------------------------------------- |
| **General**             | Dashboard       | `/dashboard`       | **MVP**                                 |
|                         | Reports         | `/reports`         | Near-term                               |
|                         | Financial       | `/financial`       | **MVP**                                 |
|                         | Integration     | `/integration`     | **Active** (added 2026-07-10, see §4.4) |
| **Orders**              | Transaction     | `/transactions`    | **MVP**                                 |
|                         | Activity        | `/activity`        | Near-term                               |
| **Products & Services** | Category        | `/categories`      | **Active** (added 2026-07-11, see §4.5) |
|                         | Product         | `/products`        | Roadmap                                 |
|                         | Payment         | `/payments`        | Roadmap                                 |
|                         | Membership      | `/memberships`     | Roadmap                                 |
| **Marketing & Content** | Promo           | `/promos`          | Roadmap                                 |
|                         | Flash Sale      | `/flash-sales`     | Roadmap                                 |
|                         | Website Content | `/content`         | Roadmap                                 |
|                         | Pages           | `/pages`           | Roadmap                                 |

Global chrome (top bar): global search, support/help, language/utility action, **theme toggle (light/dark)**, notifications, and the user menu (avatar + name + email + dropdown → profile/logout).

---

## 4. MVP Feature Specs

> **Revision (2026-07-10):** Integration (§4.4) was originally scoped as Roadmap/post-MVP (§5). It's added here as an active build at the user's direction, alongside a concrete reference design — this is a deliberate scope addition, not a silent one; the original three-feature MVP order (Dashboard → Financial → Transaction) is unchanged, Integration is simply now also in active scope.

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

### 4.2 Financial (`/financial`)

> **Revision (2026-07-10):** replaced with the confirmed Figma/reference design. The original version of this section (revenue/net-income chart, credit/debit ledger) was written speculatively before any Finance design existed and did not match reality — it's superseded below.

A read-first financial monitoring surface — a summary view, not a ledger or report builder. Per the reference: header **"Financial Summary"** with subcopy **"Monitor payment gateway credit, user debit, and supplier balances in real time. Click an amount to copy."**

**Overview stat cards (×3):** `Total Credit`, `Total Debit`, `Profit` — same `StatCard` + `TrendPill` pattern as the Dashboard (now a shared component, not dashboard-only), each with a period-over-period trend pill.

**Payment Gateway section** — "Summary of balances on each payment gateway." A list of the platform's own payment gateway(s); the reference shows one (**UxioPay**), but the data shape must support multiple (the roadmap already anticipates more payment methods). Each row shows the gateway's logo, name, and two balances side by side:

- **Saldo Aktif** (Active Balance) — currently usable/withdrawable.
- **Saldo Tertahan** (Held Balance) — funds in a rolling reserve or pending settlement, not yet usable.

> These two labels appear in Indonesian in the reference even though the rest of the admin is English-only. Treated as gateway-specific domain terminology (kept as-is) rather than general admin copy — confirm if you'd rather translate them.

**Supplier section** — "Summary of the balances available with each supplier." A grid of the platform's upstream digital-goods providers — the reference shows five (**Digiflazz Buyer, Digiflazz Seller, UxioTopup, Zelpoint, Topupkuy**), each showing a logo, name, and a single balance: the platform's prepaid deposit held with that provider (used to fulfill top-up orders) — a distinct concept from the Payment Gateway balances above.

**Interaction:** every currency amount on this screen is click-to-copy, per the subcopy.

> **Still provisional (do not invent):** the precise definition of "Profit" (gross margin vs. net of gateway fees), whether balances are polled/live or point-in-time, and whether a deeper ledger/export view exists beyond this summary — the reference only shows this one screen. Build exactly what's shown; surface anything beyond it as an open question rather than inventing it.

### 4.3 Transaction (`/transactions`)

> **Revision (2026-07-10):** enriched with confirmed detail from the Automatic Transaction History reference (image + Figma). This elaborates the original spec below rather than replacing it — the operator actions and recap/export intent still hold; the shape is now concrete.

The operational core, split into **two tabs — Automatic and Manual** — reflected in the breadcrumb ("Transaction › Automatic") as real nested routes, not just client-side tab state: `/transactions/automatic` (default) and `/transactions/manual`. **Automatic** is fully specified below from the reference. **Manual** has no reference yet — build it reusing the same table/filter pattern with a reduced, sensible column set (no provider/callback fields), and treat its exact shape as provisional pending a design.

**Automatic tab — header:** "Automatic Transaction History" + subcopy "Monitor all automated transactions that have been processed along with their status and details."

**Status pills (×3, clickable filters with counts + tooltip):**

- `Pending` — "Invoice paid but not yet processed by supplier"
- `Partial Refund` — "Some item refunded, other still in progress"
- `Partial Success` — "Some item succeeded, other still in progress"

**Filter bar (10 fields):** Search, User, Category, Product, Invoice Status, Payment Status, Start Date, End Date, Invoice From, Payment Method — all wired into the server-side table's query params per `system_architecture.md §4.8`.

**Table columns:** Invoice No. (+ sub-reference code), User (avatar + name + phone), Product (name + game), Cost (+ Profit, muted, below), Target (provider/destination account ref), **Status — two stacked badges** (Payment Status over Invoice Status, matching the two separate status fields confirmed by the edit modal below), Method (+ Admin fee, muted, below), Time (created timestamp + resolved timestamp + a small elapsed-duration badge — confirm its exact unit format via the Figma frame, it's not fully legible in the flat image), Action (row menu).

**Row action menu (exact items, in order):** Activity Log, Resend Callback, Retry Invoice, View Invoice, Transaction Detail, Edit Invoice, **Delete** (destructive-styled). `Edit Invoice` navigates to the dedicated page below (2026-07-13: changed from a modal to a real route, see below), `Activity Log` opens the modal described next. Confirm via Figma whether this menu differs for success vs. failed rows — the reference only shows it open on a failed row.

**Activity Log modal** (confirmed 2026-07-13, was previously just a bare menu-item name with no shape): a dialog titled "Activity Log" listing the audit trail for the one transaction it was opened from — columns No., User (avatar + name + phone — who performed the entry, could be an operator or "System" for automated events), Action, Description, Time. The reference's subcopy is again "Set the dimentions for the layer." — the same unedited shadcn dialog template default already flagged on the Edit Transaction page, not real copy, write an accurate one (e.g. "A record of every status change and action taken on this transaction."). The reference's two example rows are identical, and both "Action" ("19 Diamond (17 + 2 Bonus)" / "Mobile Legends Indonesia") and "Description" ("1453734892(16057)") show the same product-name/target-reference values already visible in the parent table row, not an actual event — this reads as unvaried, not-yet-customized placeholder content rather than confirmed column semantics. Build "Action" as a short event label instead (e.g. "Invoice Created", "Status Changed", "Callback Resent", "Manually Edited") and "Description" as the specific detail of that event (e.g. "Status changed from Pending to Success", "Callback sent to provider, response 200 OK") — keep the table structure (No./User/Action/Description/Time) exactly as shown, only the example values are being reinterpreted.

**Edit Transaction page** (= manual status override; **changed 2026-07-13 from a modal to a dedicated page** — same fields, different presentation): a real nested route, reached from the row menu, breadcrumb `Transaction › Automatic › Edit Transaction` confirming it's `/transactions/automatic/$invoiceNo/edit` (or wherever it sits once the `/admin` route-prefix change has been applied — see `system_architecture.md §4.1`), not client-side modal state. Single-column layout this time (unlike the two-column Add Category form) — header card "Edit Transaction" with a real subcopy (the reference shows "Lorem Ipsum Dolor Sit Amet.", still placeholder despite being spelled correctly this time, not real copy), then a second card with the fields: Status Payment (select), Invoice Status (select), Serial Number, and an Invoice Proof file dropzone (JPG/JPEG/PNG up to 10MB, multipart upload per `system_architecture.md §4.9`, no S3), with Cancel/Save at the bottom-right of that card. The Serial Number field renders as a select showing the literal word "Text" — this is the **second** independent reference showing this exact same artifact (also seen on the original modal version), reinforcing that it's a template bug, not an intentional design — build it as a plain text input. Cancel returns to the transaction list; Save behaves the same as the modal version did (disabled while pending, success navigates back with a toast, failure stays on the page and shows the error).

**Still open / not visible in this reference — don't invent, flag instead:**

- **Export** and **Recap** (per the original spec below) aren't visible in these four images — check the Figma frame for a header action that may be off-screen; if genuinely absent from the design too, build the underlying service capability but leave the trigger's placement TBD.
- A horizontal slider spans the table footer with no visible label or connected control. Likely a decorative/leftover element (the modal already has one confirmed template artifact) — verify via Figma; if it isn't wired to anything there either, omit it.

**Operator actions (all required this phase — UI + wired to typed service stubs):**

- **Manual status override** — the Edit Transaction page above.
- **Refund** — initiate a refund (confirmation + reason).
- **Re-trigger provider callback** — "Resend Callback" in the row menu.
- **Resend receipt** — resend the transaction receipt to the customer (not visible as a distinct menu item in the reference — confirm whether "View Invoice" covers this or it's a genuine gap).
- **Export** — download the transaction (or filtered set) as CSV/Excel (placement TBD, see above).

**Recap**

- A **transaction recap** report: daily and monthly summaries, downloadable, with **breakdown per game / product / payment channel** (totals, counts, revenue). This is the concrete meaning of "rekap transaksi". Placement TBD, see above.

> Destructive/irreversible actions (refund, status override, delete) MUST use a confirmation step and surface success/failure via toasts (`sonner`). Actions are permission-gated via `<Can>` even though Super Admin holds all permissions today. Hard-deleting a financial transaction record is unusual for audit/compliance reasons — build the `Delete` menu item and its confirmation as shown, but flag this as worth confirming rather than assuming it's truly a permanent hard delete.

### 4.4 Integration (`/integration`)

Connection/health management for every external channel the platform depends on — **distinct from Financial (`§4.2`)**: Financial tracks _money_ (balances); Integration tracks _connectivity_ (is the channel reachable, when did we last check). Both may reference the same real-world channel (e.g. "UxioPay", "Digiflazz Buyer") and both may show a balance, but they answer different questions and are separate data concerns — don't merge them into one shared entity.

**Header:** "Integration" + subcopy "Manage digital supplier connections, payment gateways, and WhatsApp gateways. Ping status and balances update per channel."

**Overview stat cards (×3, a variant without trend pills):** each has a small leading icon, a plain label, a big count, and a **plain descriptive caption** (not a trend pill or "since last month"):

- `Total Channels` — count, caption breaks it down by type (e.g. "4 Supplier, 2 Payment, 1 WhatsApp").
- `Active` — count, caption "Channels with an active connection (status ping)."
- `Disconnected` — count, caption "Registered channels with a lost connection."

**Category filter (segmented control, 5 options):** `All` (default), `Supplier`, `Payment Gateway`, `Whatsapp Gateway`, `Email Gateway` — four channel types exist even if a type currently has zero registered channels (Email Gateway has none in the reference, yet still appears as a filterable category).

**Channel cards (grid):** logo (placeholder square if none set), name, a currency/config description line (e.g. "Indonesia Rupiah (Rp) IDR - Rp 1" — read this as the channel's currency/minimum-unit configuration, distinct from its balance), then a row with a connection-status badge (`Connected` / `Disconnected`) and a balance badge, plus a row-level menu (ping/refresh now, edit connection, view details — exact set not confirmed by a reference, build a sensible default and flag it).

**Ping & balance refresh:** per the header subcopy, connection status and balances update per channel — implement via TanStack Query polling (`system_architecture.md §4.9`), not a one-time fetch.

> **Provisional / flagged, not invented:** the row-level menu's exact items (no reference shows it open); the precise meaning of the per-card currency line; whether the four "Supplier" channels are a subset of Financial's five (`UxioTopup` being self/in-house and needing no external integration is a plausible reconciliation, not confirmed); and a second Payment Gateway beyond `UxioPay` shown in Financial (`Monetapay`, the consumer platform's gateway, is a reasonable candidate given these are related products, but this isn't confirmed either).

### 4.5 Category (`/categories`)

> **Revision (2026-07-11):** promoted from Roadmap (§5) to active scope, same pattern as Integration (§4.4) — a deliberate addition at the user's direction, not a silent one.

Product taxonomy management — how games/products are grouped for the storefront. **Five tabs**, reflected as nested routes: `Category` (default), `Sub Category`, `Category Type`, `Server Category`, `Supplier Category`. Only the first tab (`Category`) has a confirmed reference this round, for both its list and its add-form — the other four are provisional, build them with the same list+add pattern and a reduced/sensible field set, flagged as such.

**Critical flag on the reference's list-view table:** the table shown in the reference (columns Header/Section Type/Status/Target/Limit/Reviewer; rows "Cover Page", "Table of Contents", "Executive Summary", reviewers "Jamik Tashpulatov"/"Eddie Lake") is the **stock shadcn/ui data-table demo dataset**, verbatim — a document-review-workflow example, not anything related to top-up categories. **Do not reproduce this content or its column semantics.** The visual/interaction _pattern_ (checkbox select, status badge, search + type-filter toolbar, refresh button, row action menu, "+ Add X" primary button) is worth keeping; the specific columns and data are not. Build sensible columns instead: Category Name, Category Type, Code/Slug, Status (a simple `active | inactive` toggle — not a review-workflow state, that doesn't fit a taxonomy record), and Actions. The row menu showed only `Delete` (destructive) in the reference; add `Edit` too since there's no other way to reach the edit form otherwise, and flag that only Delete was visually confirmed.

**Add Category form** (this part of the reference **is** deliberately designed, follow it precisely) — breadcrumb `Category › Category › Add Category`. Header "Add Category" with a real subcopy you write (the reference repeats the same "lorem ipsum dolot sit amet" placeholder on both the list and add pages — not real copy, don't use it anywhere).

_Basic information_ section (subcopy: "Type, validation, and category identity on the storefront."), two-column grid: `Category Type` (select), `Category UID Parser` (select), `Category Name` (the reference renders every field with a "Type to search..." select-style placeholder uniformly, but a _name_ is typed, not chosen from existing options — build this and `Category Sub Name` as plain text inputs, not selects), `Category Sub Name` (text), `Account Nickname Validation` (select), `Region` (select), `Category Code` (text), `Category Slug` (text, reasonable to auto-derive from the name but keep it editable).

_Category form_ section (subcopy: "Input fields shown to buyers when ordering.") — a **dynamic, repeatable field-definition builder**: each entry defines one input the _consumer_ top-up site's order form will show for this category (e.g. a `user_id` or `server_id` field). This is the first place Admin's data model directly describes consumer-facing behavior — worth noting for later backend work, not something to wire up now (UI-first, no real connection to the consumer app). Include the reference's info callout verbatim, it's real product guidance, not placeholder: "Do not use whatsapp or email keys — buyer contact is taken from their account." / "Suggested keys: user_id, server_id." Empty state: "No forms yet. Click "Add Form" to add one." with an "+ Add Form" button that appends a new field-definition row (`useFieldArray` from React Hook Form is the natural fit).

_Media & description_ section (subcopy: "Category logo and description content for the product page."), added 2026-07-11 from a further-scrolled reference: a `Category Logo` upload dropzone (JPG/JPEG/PNG up to 10MB, multipart per `system_architecture.md §4.9`) with caption "3:4 ratio recommended · max display ~WxH px" — the reference literally shows "~000x000 px", an unfilled placeholder, use a real reasonable dimension instead (e.g. 800×600) and flag it as not confirmed. The section name/subcopy explicitly promises "description content" but no such field is visible in the reference crop before it cuts to the next section — add a reasonable `Description` textarea, flagged as inferred rather than confirmed.

_SEO_ section (subcopy: "Meta tags for the category page on search engines."): `Meta Title` (text, placeholder "Title for search results & the browser tab"), `Meta Description` (textarea, placeholder "Short summary for search results", with a live character counter out of 280 — the reference shows "0/280 characters" next to "52% used", a mismatched/non-functional mock, build it to actually reflect the entered length, e.g. 0 chars = 0% used). Then a second image-upload field the reference labels "Category Logo" again with the identical dropzone/caption as the Media & description section above — a duplicate label is very likely a copy-paste artifact in Figma; a second, separate image field in an SEO section is much more likely meant to be an **OG/social-share preview image**, a genuinely different and common SEO concept from the page's product logo. Build it as `OG Image` (or similar), flagged as a relabeling, not confirmed. Then `Meta Keyword` (text, placeholder "Separate with commas, e.g. top up ml, diamond ml") and `Meta Robot` (select, standard index/follow directives, placeholder "Select").

These two sections come after _Category form_ and before the existing Save/Cancel actions — same form, not a new page. If Add and Edit Category already share one form component, extend that one component rather than duplicating these fields into a second place.

---

## 5. Roadmap (Post-MVP Modules)

Documented so architecture and navigation accommodate them; **not built this phase.**

- **Product management** — `Game → hasMany Product (nominal)`. Each product stores **cost price + selling price** (admin sees margin), an upstream **provider/SKU mapping**, and an **availability toggle**. (Category, which groups games/products, moved to `§4.5` — no longer roadmap; Product itself is still roadmap.)
- **Promo management** — promo **types** (percentage / fixed amount / special price); **scope** (global / per-game / per-product / per-payment-method); **quota** (total + per-user); **validity window**; **minimum purchase**; optional tie-in to a consumer homepage promo banner. Flash Sale is a time-boxed variant.
- **Content / Website Content** — manage consumer homepage content: hero/CTA banners, articles/blog, "Game Populer", testimonials, payment-method logos, footer. **Pages** for static content.
- **Payment methods** — enable/disable channels, configure fees (gateway is backend-proxied on the consumer side).
- **Users (customers)** — manage the consumer platform's end-users: profile, **wallet/balance** (top-up/adjust), transaction history, suspend/ban. Guests have no user record (one-off purchases).
- **Membership** — tiering/loyalty (scope TBD).
- **Settings / SEO**, **Audit Logs**, and **Reports** (dedicated reporting hub). (Integration moved to `§4.4` — no longer roadmap.)
- **Security** — **2FA (TOTP)** for admin login.

---

## 6. Core Data Entities (Provisional)

Backend is not built; these are **FE-facing entity briefs** to shape typed models and mock fixtures. They live in `src/types/models/` (global) or the owning feature's `types/` (feature-specific). Treat all fields as provisional and revise when the API contract lands.

- **User** (renamed from "AdminUser" — 2026-07-11, confirmed against the real login response) — `id`, `role_id: number` (see the RBAC revision in `system_architecture.md §5` — this replaces the speculated `roles`/`permissions` arrays), `name`, `email`, `phone`, `balance`, `point`, `locale`, `timezone`, `email_verified_at`, `two_factor_confirmed_at?` (still not in the real response, kept optional/reserved for when 2FA lands), `created_at`, `updated_at`. `balance`/`point`/`locale` are evidently shared with the consumer platform's user model (not admin-specific concepts) — type them for accuracy, don't build any admin UI around them. No `avatar_url` field exists — the navbar/sidebar user menu needs an initials-based fallback, not an image, until/unless one is added.
- **Transaction** — `id`, `invoice_no`, `invoice_ref?` (the sub-code shown under the invoice number), `payment_status` and `invoice_status` (confirmed as **two separate fields**, not one — `pending | processing | success | failed | partial_refund | partial_success | …`), `customer` (user ref or guest snapshot, `user_id: number | null`), `game` ref, `product` ref (nominal), `cost`, `profit?`, `admin_fee?`, `target_ref?` (provider/destination account reference), `payment_method`, `serial_number?`, `proof_url?` (from the edit-modal upload), `created_at`, `resolved_at?`, `status_history[]`, `activity_log: ActivityLogEntry[]` (§4.3's Activity Log modal — `{ id, actor: { name, phone? } | "system", action: string, description: string, created_at }`), `updated_at`.
- **BalanceMovement (ledger)** — `id`, `type` (`credit | debit`), `amount`, `running_balance`, `source`/`reference`, `status`, `created_at`.
- **Game** — `id`, `name`, `publisher`, `image_url`, `is_active` (referenced by transactions/dashboard).
- **Product (nominal)** — `id`, `game_id`, `name`, `cost_price`, `selling_price`, `provider_sku?`, `is_available` (referenced; full CRUD is roadmap).
- **DashboardSummary** — aggregate view-model for the dashboard stat cards and chart (not a raw table): totals, trend deltas, time-series points.
- **PaymentGatewayBalance / SupplierBalance** (§4.2) — feature-local to `features/financial/types/` for now, not global: `{ id, name, logoUrl }` plus `activeBalance`/`heldBalance` (gateway) or a single `balance` (supplier). Promote to `src/types/models/` only if another feature (e.g. Transaction, referencing which supplier fulfilled an order) needs them too.
- **IntegrationChannel** (§4.4) — feature-local to `features/integration/types/`, a deliberately separate concern from the two entries above (connectivity, not money): `id`, `type` (`supplier | payment_gateway | whatsapp_gateway | email_gateway`), `name`, `logo_url?`, `currency_config?`, `connection_status` (`connected | disconnected`), `balance?`, `last_ping_at?`, `created_at`, `updated_at`.
- **Category** (§4.5) — feature-local to `features/categories/types/`: `id`, `type`, `uid_parser`, `name`, `sub_name?`, `account_nickname_validation?`, `region?`, `code`, `slug`, `status` (`active | inactive`), `order_form_fields: { key: string; label?: string; required?: boolean }[]` (the buyer-facing dynamic field definitions), `logo_url?`, `description?`, `meta_title?`, `meta_description?`, `og_image_url?`, `meta_keywords?: string[]`, `meta_robots?`, `created_at`, `updated_at`. Global entity references (`Game`, `Product`) may link to a category later; keep this feature-local until that link is actually built.

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

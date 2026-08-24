# Product Requirements Document (PRD): UDN Admin Dashboard

> **Source of truth for _what_ we build.** Every agent MUST read this before any task.
> Precedence when documents conflict: `system_architecture.md` → `product_requirements.md` → `design_system.md` → `CLAUDE.md`.

---

## 0. Document Status & Scope Guardrails

- **Product:** UDN Admin Dashboard — an internal back-office SPA for operators to manage the UDN multi-game top-up platform (data management, financial oversight, transaction operations).
- **Relationship to the consumer platform:** This admin app runs against the **same backend** as the public "UDN Top Up Website" (`uxiotopup-api`), on that API's admin route group. The **frontends** are decoupled — never import consumer code — but the **database is shared**, which is why the user model carries consumer-side fields like `balance` and `point`.
- **Backend status:** The admin API is **live and integrated** — every feature service calls it. The UI-first mock phase is finished; the typed service interface it left behind is still the boundary hooks depend on (see `system_architecture.md §6`).
- **Language:** English-only for MVP. No i18n layer is installed (`react-i18next` is intentionally absent). This may be revisited post-MVP.
- **Non-goals this phase:** 2FA, multi-role RBAC UIs, S3/cloud uploads. (Real API integration, real-time push and content/promo CRUD have all since shipped — the API is live, `src/lib/echo.ts` drives Pusher-backed transaction updates, and the `content` + `marketing` slices own CMS and promo CRUD.) (Product CRUD was a non-goal until 2026-07-28, when the Main Products list was promoted to active scope — see §4.6. Product **create/update** remains out of scope pending a reference frame.)

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
|                         | Product         | `/products`        | **Active** (added 2026-07-28, see §4.6) |
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

Product taxonomy management — how games/products are grouped for the storefront. **Five tabs**, reflected as nested routes: `Category` (confirmed), `Sub Category` (confirmed, 2026-07-14), `Category Type` (confirmed, 2026-07-14), `Category Server` (**renamed from "Server Category"**, confirmed 2026-07-14), `Category Provider` (**corrected from "Supplier Category"**, confirmed 2026-07-14 — see below). **All five tabs are now confirmed**, none remain provisional.

**A recurring problem across every tab's reference so far, confirmed again on Sub Category:** breadcrumbs, lorem-ipsum copy, mismatched character counters, and unfilled placeholder dimensions keep appearing verbatim from what looks like a single shadcn-template source duplicated across frames. Don't trust any given reference's copy/labels at face value — cross-check against what the page actually does, the same way each fix below was reasoned out.

**Critical flag on the reference's list-view table:** the table shown in the reference (columns Header/Section Type/Status/Target/Limit/Reviewer; rows "Cover Page", "Table of Contents", "Executive Summary", reviewers "Jamik Tashpulatov"/"Eddie Lake") is the **stock shadcn/ui data-table demo dataset**, verbatim — a document-review-workflow example, not anything related to top-up categories. **Do not reproduce this content or its column semantics.** The visual/interaction _pattern_ (checkbox select, status badge, search + type-filter toolbar, refresh button, row action menu, "+ Add X" primary button) is worth keeping; the specific columns and data are not. Build sensible columns instead: Category Name, Category Type, Code/Slug, Status (a simple `active | inactive` toggle — not a review-workflow state, that doesn't fit a taxonomy record), and Actions. The row menu showed only `Delete` (destructive) in the reference; add `Edit` too since there's no other way to reach the edit form otherwise, and flag that only Delete was visually confirmed.

**Add Category form** (this part of the reference **is** deliberately designed, follow it precisely) — breadcrumb `Category › Category › Add Category`. Header "Add Category" with a real subcopy you write (the reference repeats the same "lorem ipsum dolot sit amet" placeholder on both the list and add pages — not real copy, don't use it anywhere).

_Basic information_ section (subcopy: "Type, validation, and category identity on the storefront."), two-column grid: `Category Type` (select), `Category UID Parser` (select), `Category Name` (the reference renders every field with a "Type to search..." select-style placeholder uniformly, but a _name_ is typed, not chosen from existing options — build this and `Category Sub Name` as plain text inputs, not selects), `Category Sub Name` (text), `Account Nickname Validation` (select), `Region` (select), `Category Code` (text), `Category Slug` (text, reasonable to auto-derive from the name but keep it editable).

_Category form_ section (subcopy: "Input fields shown to buyers when ordering.") — a **dynamic, repeatable field-definition builder**: each entry defines one input the _consumer_ top-up site's order form will show for this category (e.g. a `user_id` or `server_id` field). This is the first place Admin's data model directly describes consumer-facing behavior — worth noting for later backend work, not something to wire up now (UI-first, no real connection to the consumer app). Include the reference's info callout verbatim, it's real product guidance, not placeholder: "Do not use whatsapp or email keys — buyer contact is taken from their account." / "Suggested keys: user_id, server_id." Empty state: "No forms yet. Click "Add Form" to add one." with an "+ Add Form" button that appends a new field-definition row (`useFieldArray` from React Hook Form is the natural fit).

_Media & description_ section (subcopy: "Category logo and description content for the product page."), added 2026-07-11 from a further-scrolled reference: a `Category Logo` upload dropzone (JPG/JPEG/PNG up to 10MB, multipart per `system_architecture.md §4.9`) with caption "3:4 ratio recommended · max display ~WxH px" — the reference literally shows "~000x000 px", an unfilled placeholder, use a real reasonable dimension instead (e.g. 800×600) and flag it as not confirmed. The section name/subcopy explicitly promises "description content" but no such field is visible in the reference crop before it cuts to the next section — add a reasonable `Description` textarea, flagged as inferred rather than confirmed.

_SEO_ section (subcopy: "Meta tags for the category page on search engines."): `Meta Title` (text, placeholder "Title for search results & the browser tab"), `Meta Description` (textarea, placeholder "Short summary for search results", with a live character counter out of 280 — the reference shows "0/280 characters" next to "52% used", a mismatched/non-functional mock, build it to actually reflect the entered length, e.g. 0 chars = 0% used). Then a second image-upload field the reference labels "Category Logo" again with the identical dropzone/caption as the Media & description section above — a duplicate label is very likely a copy-paste artifact in Figma; a second, separate image field in an SEO section is much more likely meant to be an **OG/social-share preview image**, a genuinely different and common SEO concept from the page's product logo. Build it as `OG Image` (or similar), flagged as a relabeling, not confirmed. Then `Meta Keyword` (text, placeholder "Separate with commas, e.g. top up ml, diamond ml") and `Meta Robot` (select, standard index/follow directives, placeholder "Select").

These two sections come after _Category form_ and before the existing Save/Cancel actions — same form, not a new page. If Add and Edit Category already share one form component, extend that one component rather than duplicating these fields into a second place.

**Sub Category tab** (confirmed 2026-07-14) — belongs to a parent `Category` (the Add form's first field is a `Category` select). List header "Sub Category" with a real subcopy (reference repeats the same placeholder as the Category tab, not real copy). Toolbar: a properly-worded "Search sub categories" input (unlike most of this feature's placeholders, this one reads as deliberately written, keep it), a "Type to search category" select filtering by parent category, refresh, "+ Add Sub Category".

Table columns: Name (the sub-category's own name, e.g. "Mobile Legends: Global"), a second column the reference also labels "Name" showing values like "Diamonds"/"Diamond" — two columns can't both be "Name", this is a labeling mistake; rename the second to something that matches its content, e.g. `Currency Name` or `Unit Name`. Then Created At, Status (`active`/`inactive` badge), Action. The footer's placeholder count reads "of 9999999 **transactions**" — copy-pasted from the Transaction feature, wrong noun for this table, say "sub categories" instead. Row menu: `Edit Sub Category`, `Delete`.

**Add Sub Category form**: header + real subcopy, then `Category` (select, the parent), `Sub Category Name` (text — every placeholder in this form's reference is generic lorem ipsum rather than a helpful hint; write real ones, e.g. "Select a category" / "e.g. Mobile Legends: Global"), `Logo` (dropzone — this one accepts **JPG, JPEG, PNG, WEBP**, one more format than the Category feature's own logo field, use the correct set for this form specifically), `Description` (textarea with the same 280-char counter pattern as Category's SEO section — same mismatch bug confirmed again, build it functionally correct). `Edit Sub Category` reuses this same form pre-filled, as a page (not a modal), consistent with how Transaction's edit ended up working.

**Delete confirmation — the most important correction this round:** the reference's dialog body reads "This action cannot be undone. This will permanently delete your account from our servers." This is shadcn/ui's own official AlertDialog documentation example, copied verbatim and never adapted — it describes deleting a user's _account_, which has nothing to do with a sub-category record. Do not use this text. Write real copy describing what's actually being deleted, e.g. "This action cannot be undone. This will permanently delete this sub category and remove it from the storefront." (adjust the count/wording for the bulk-delete case below). Buttons: "Cancel" / "Continue" (destructive).

**Bulk delete:** selecting rows via the table's checkboxes surfaces a `Delete (N)` button in the toolbar (N = selection count), triggering the same confirmation dialog, worded to match the count (e.g. "permanently delete these 2 sub categories").

**Category Type tab** (confirmed 2026-07-14) — simpler than Category/Sub Category, no logo or description. List header "Category Type" + real subcopy (same placeholder pattern, not real copy). Toolbar: "Search category type", refresh, "+ Add Category Type" — no parent-category filter here, unlike Sub Category, this tab has no parent.

Table columns: Name, Voucher (a dash `-` when the type isn't a voucher type, presumably some positive indicator like a checkmark or "Yes" when it is — driven by the add-form's checkbox below), Status, Action. **Status is confirmed inconsistent across the reference's own screenshots** — one shows "Active"/green, another shows "In Process"/green for the exact same two rows. "In Process" is the old shadcn demo dataset's status vocabulary bleeding through again (the same dataset flagged and discarded when the Category tab was first built) — use `active | inactive` as the real status model, it's also what the row menu's "Deactive" action implies. Same footer-noun bug as every other tab so far: fix "of 9999999 transactions" to "category types".

**Add Category Type form**: just two fields — `Category Type Name` (text, the reference's placeholder is generic lorem ipsum, write a real hint like "e.g. Voucher, Direct Top Up") and a checkbox **"This category type is for vouchers"** with helper text **"Enable if this category type is used for selling vouchers or digital codes."** — unlike almost every other placeholder in this whole feature, this specific checkbox + helper text reads as deliberately written, not lorem ipsum; use it verbatim. This checkbox is what the list table's `Voucher` column reflects.

**Row menu, three items:** `Deactive` (a status-icon, toggles `active`⇄`inactive` — the reference only shows this label on an active row; on an inactive row it should read `Activate` instead, toggling the other way, not stay permanently labeled "Deactive"), `Edit Category Type` (page, same reused pattern as every other edit flow in this feature), `Delete` (destructive).

**Two different confirmations needed, don't conflate them:**

- **Delete** — reuse the same delete-confirmation component already built and fixed for Sub Category (the one that replaced the shadcn "permanently delete your account" boilerplate). This reference shows the _exact same wrong "your account" text_ a third time, confirming it's one shared, never-customized dialog in the source design, not three separate mistakes — the fix belongs in the shared component, not per-tab. Word it for a category type this round (e.g. "This action cannot be undone. This will permanently delete this category type."). Note also: this reference's confirm button says "Delete", while the Sub Category reference said "Continue" for the equivalent button — standardize on "Delete" for delete-confirmations, it's clearer.
- **Deactivate** — a separate, gentler confirmation, not a copy of the delete one. The reference reuses the exact same broken "permanently delete your account from our servers" body text here too, which doesn't even match its own dialog's title ("Are you absolutely sure deactive?", also grammatically off) — this is the clearest evidence yet that the body copy was never adapted per action. Deactivating is reversible (can be turned back on), so word and style it accordingly: a neutral, non-destructive icon and button (not red), title like "Deactivate this category type?", body like "This will hide it from being selectable. You can reactivate it anytime." Confirm button reads "Deactivate" (or "Activate" when reversing).

**Category Server tab** (confirmed 2026-07-14, **renamed from "Server Category"**): within a single reference round the tab bar itself read "Server Category" while the page header, breadcrumb, button, and add-page all consistently read "Category Server" — an internal inconsistency, not a one-off typo. Page-level content used the reversed order four separate times, so that's the name going forward everywhere, including fixing the tab-bar label to match (a tab reading one name that opens a page titled the reverse would be confusing regardless of which order is "more correct").

Simpler than the two tabs before it — **no status/active-inactive concept at all**. List header "Category Server" + real subcopy (still placeholder in the reference). Toolbar: "Search Category Server" (reads as deliberately written, use as-is), refresh, "+ Add Category Server" — no parent-category filter, same as Category Type. Table: just three columns, No., Category Server Name, Action — no Status column, which is why the row menu (next) has no deactivate/activate item either, unlike Category Type. Same recurring footer-noun bug, fix "of 9999999 transactions" to "category servers".

**Row menu, two items:** `Edit Category Server`, `Delete` (destructive) — no third "deactivate" item, consistent with there being no status concept for this entity.

**Add Category Server form** — the reference's main field is labeled **"Category Type Name"**, not "Category Server Name" — this is a leftover from copy-pasting the Add Category Type form (built immediately prior) as a starting point, not a real second reference to category types. Fix the label to `Category Server Name`. Below it, a **new, distinct pattern not seen in the other tabs**: an "+ Add Option" button that appends rows to a simple repeatable `Name` / `Value` pair list (two plain text inputs per row) — build this as a field array (same underlying mechanism as the Category form's field-builder, but simpler: just two plain text fields per row, no type/required metadata). The reference only shows one row with no visible remove control — add a reasonable per-row remove affordance too, flagged as inferred since it isn't shown. Cancel/Save at the bottom, same behavior as every other form here.

**Delete confirmation** — the exact same "This action cannot be undone. This will permanently delete your account from our servers." text, confirmed a **fourth** time. Reuse the already-fixed shared delete-confirmation component (built for Sub Category, reused for Category Type) with wording for a category server; don't re-solve this again.

**Category Provider tab** (confirmed 2026-07-14 — **the fifth and last tab, this completes the whole feature**). Maps which upstream supplier fulfills which category, via which integration template — genuinely connects to entities already established elsewhere: the `Provider` column's values ("Digiflazz Buyer", "Uxiotopup") are the same supplier names already used in Financial (`§4.2`) and Integration (`§4.4`); `Category` links to this same feature's own `Category` tab.

List header "Category Provider" + real subcopy (still placeholder in the reference). Table columns: Provider, Category, Provider Template, Created At, Action — no Status column visible in this reference, same as Category Server. Same recurring footer-noun bug, fix to "category providers".

**Two confirmed leftover-label bugs, both from copy-pasting the just-built Category Server tab:** the toolbar's add button reads "+ Add Category Server" (should be "+ Add Category Provider") and the add-page's own header reads "Add Category Server" (should be "Add Category Provider") — both need correcting, this is the same class of mistake as "Category Type Name" on the previous tab, just landing in two places instead of one this time.

**Row menu:** `Edit Category Provider`, `Delete` — two items, correctly labeled in this reference (unlike the button/header above). One of the reference screenshots shows checkboxes selected but the bulk-action area renders garbled/overlapping and isn't clearly legible — if this tab supports row selection at all, give it the same bulk-delete treatment already established for Sub Category (a `Delete (N)` toolbar button when rows are checked); don't leave checkboxes with no resulting action.

**Add Category Provider form:** three select fields — `Provider`, `Category`, `Provider Template` — all still lorem-ipsum-placeholder'd in the reference, write real hints (e.g. "Select a provider", "Select a category", "Select a template").

**On deactivation, called out in the request but not visible here:** unlike Category Type, none of these five images show a Status column or a Deactivate/Activate menu item for Category Provider — the request asked for a deactivation confirmation too, which may just be carried over phrasing from the Category Type round rather than something this specific design actually has. Check the Figma frame directly for a Status column that might sit outside this crop; if it genuinely isn't there, don't force a deactivate feature onto a table structure that doesn't have a status field to begin with.

**Delete confirmation** — the same text, confirmed a **fifth** time. Reuse the shared component again, worded for a category provider.

### 4.6 Product (`/products`)

> **Revision (2026-07-28):** promoted from Roadmap (§5) to active scope, the same documented pattern as Integration (§4.4) and Category (§4.5) — a deliberate addition at the user's direction, not a silent one. §0's non-goals line is amended to match, and the Product bullet in §5 is struck.

Two tabs, reflected as nested routes: `Main Products` (confirmed) and `Product Provider` (**label only** — the tab exists in the reference's tab bar and nothing else does; the screen has no frame). Only the Main Products **list** has a reference; there is no Add/Edit form frame, so that route ships as an explicit placeholder rather than an invented form.

**Reference availability:** the Figma file could not be read. The MCP server authenticates, but every call on `l7izBcDr0PtS2FUdMdHFk3` returns *"you don't have edit access to this file"* — the account holds a **View** seat and the Figma MCP requires edit. This is a harder blocker than the expired token recorded in the two prior logs: re-authenticating will not fix it, only a seat change will. The spec below is read off a supplied screenshot.

**Main Products list.** Header "Main Products" with a real subcopy you write (the reference repeats the same "lorem ipsum dolor sit amet" placeholder as all five Category tabs). Toolbar left to right: a "Search product name" input, a "Type to search category" select, an "All Price" select, a refresh icon-button, and a primary "+ Add Main Products" button.

Table columns: selection checkbox, `No.`, `Product`, `Variant`, `Game`, `Created At`, `Status`, `Action`.

- **Product** — thumbnail, product name, then muted meta lines (category and product code). No product art exists yet, so the thumbnail falls back to a squared initials tile; real URLs drop in later with no code change.
- **Variant** — one block per variant: variant name, its price, and its own status badge. This is where the money actually lives.
- **`Game` is a correction.** The reference heads this column **"Price"** but fills it with game names ("Garena Mobile Leg…", "Free Fire Indonesia"), while the price sits in the Variant cell. A column cannot be named for data it does not contain — the same class of mistake as Sub Category's two columns both labelled "Name". Confirmed with the user, not inferred. Named `Game` for its content.
- **Status — two axes, not one repeated state.** The reference stacks two badges per row (three on one row). Modelled as `status` (`active | inactive`, the Category precedent) plus `is_available` (`Available | Unavailable`, the §6 entity field). The extra badge on the second row is a **per-variant** badge inside the Variant cell, not a third product-level field.
- **Action** — a row menu with `Edit Product` and `Delete`. Edit is a stub this round, since the form has no reference.

**Row selection and bulk delete** follow the pattern already established for Sub Category and Category Provider: checking rows surfaces a `Delete (N)` toolbar button that opens the same confirmation as the row menu's Delete, worded for the count. Reuse the shared delete dialog — this reference is the sixth to ship shadcn's "permanently delete **your account** from our servers" boilerplate.

**Footer — the same recurring bug, sixth confirmation:** the count reads "of 9999999 **transactions**", copy-pasted from Transaction. Say "products", and report the real total rather than the 9999999 placeholder. The page-size trigger reads "10 Row" (keep that label); the pagination is drawn as a static `1 2 3 4`, which is a mock, not a behaviour — keep the real sliding window.

**Inferred, not confirmed** (revise when a reference or the API lands):

- The **"All Price" filter's options are never shown** — the reference only ever renders its closed trigger. Modelled as price-range buckets, with "All Price" as the clear value.
- **`game_name` is denormalized** onto the product because no Game service exists; the real API will join.
- The Variant cell's **"Fix" prefix** reads like a price *type*, but only one value is observable, so it is not modelled as a field yet.

---

## 5. Roadmap (Post-MVP Modules)

Documented so architecture and navigation accommodate them; **not built this phase.**

- **Product management** — `Game → hasMany Product (nominal)`. (Moved to `§4.6` on 2026-07-28 — **no longer roadmap**, same documented promotion as Category `§4.5`. What remains roadmap is the part with no reference frame: the Add/Edit **form** — including **cost price** alongside selling price so the admin sees margin, and the upstream **provider/SKU mapping** — plus the whole **Product Provider** tab. The list, the availability toggle's data model, and delete are built.)
- **Promo management** — promo **types** (percentage / fixed amount / special price); **scope** (global / per-game / per-product / per-payment-method); **quota** (total + per-user); **validity window**; **minimum purchase**; optional tie-in to a consumer homepage promo banner. Flash Sale is a time-boxed variant.
- **Content / Website Content** — manage consumer homepage content: hero/CTA banners, articles/blog, "Game Populer", testimonials, payment-method logos, footer. **Pages** for static content.
- **Payment methods** — enable/disable channels, configure fees (gateway is backend-proxied on the consumer side).
- **Users (customers)** — manage the consumer platform's end-users: profile, **wallet/balance** (top-up/adjust), transaction history, suspend/ban. Guests have no user record (one-off purchases).
- **Membership** — tiering/loyalty (scope TBD).
- **Settings / SEO**, **Audit Logs**, and **Reports** (dedicated reporting hub). (Integration moved to `§4.4` — no longer roadmap.)
- **Security** — **2FA (TOTP)** for admin login.

---

## 6. Core Data Entities (Provisional)

These are **FE-facing entity briefs** shaping the typed models. They live in `src/types/models/` (global) or the owning feature's `types/` (feature-specific). The API is live, so the contract is now observable: verify a field against the real response (or `uxiotopup-api`'s Resource/migration) before trusting a brief marked provisional here.

- **User** (renamed from "AdminUser" — 2026-07-11, confirmed against the real login response) — `id`, `role_id: number` (see the RBAC revision in `system_architecture.md §5` — this replaces the speculated `roles`/`permissions` arrays), `name`, `email`, `phone`, `balance`, `point`, `locale`, `timezone`, `email_verified_at`, `two_factor_confirmed_at?` (still not in the real response, kept optional/reserved for when 2FA lands), `created_at`, `updated_at`. `balance`/`point`/`locale` are evidently shared with the consumer platform's user model (not admin-specific concepts) — type them for accuracy, don't build any admin UI around them. No `avatar_url` field exists — the navbar/sidebar user menu needs an initials-based fallback, not an image, until/unless one is added.
- **Transaction** — `id`, `invoice_no`, `invoice_ref?` (the sub-code shown under the invoice number), `payment_status` and `invoice_status` (confirmed as **two separate fields**, not one — `pending | processing | success | failed | partial_refund | partial_success | …`), `customer` (user ref or guest snapshot, `user_id: number | null`), `game` ref, `product` ref (nominal), `cost`, `profit?`, `admin_fee?`, `target_ref?` (provider/destination account reference), `payment_method`, `serial_number?`, `proof_url?` (from the edit-modal upload), `created_at`, `resolved_at?`, `status_history[]`, `activity_log: ActivityLogEntry[]` (§4.3's Activity Log modal — `{ id, actor: { name, phone? } | "system", action: string, description: string, created_at }`), `updated_at`.
- **BalanceMovement (ledger)** — `id`, `type` (`credit | debit`), `amount`, `running_balance`, `source`/`reference`, `status`, `created_at`.
- **Game** — `id`, `name`, `publisher`, `image_url`, `is_active` (referenced by transactions/dashboard).
- **Product (nominal)** (§4.6) — feature-local to `features/products/types/`, snake_case: `id`, `name`, `image_url?`, `game_id`, `game_name` (denormalized — no Game service exists; the real API will join), `category_name`, `code` (this brief's original `provider_sku`), `status` (`active | inactive`), `is_available`, `variants: { id; name; price; status }[]`, `created_at`, `updated_at`. **`cost_price`/`selling_price` are not modelled yet** — the reference's list shows one price per variant and no margin, and the Add/Edit form that would capture cost is still roadmap (§5). Add them with that form, not before.
- **DashboardSummary** — aggregate view-model for the dashboard stat cards and chart (not a raw table): totals, trend deltas, time-series points.
- **PaymentGatewayBalance / SupplierBalance** (§4.2) — feature-local to `features/financial/types/` for now, not global: `{ id, name, logoUrl }` plus `activeBalance`/`heldBalance` (gateway) or a single `balance` (supplier). Promote to `src/types/models/` only if another feature (e.g. Transaction, referencing which supplier fulfilled an order) needs them too.
- **IntegrationChannel** (§4.4) — feature-local to `features/integration/types/`, a deliberately separate concern from the two entries above (connectivity, not money): `id`, `type` (`supplier | payment_gateway | whatsapp_gateway | email_gateway`), `name`, `logo_url?`, `currency_config?`, `connection_status` (`connected | disconnected`), `balance?`, `last_ping_at?`, `created_at`, `updated_at`.
- **Category** (§4.5) — feature-local to `features/categories/types/`: `id`, `type`, `uid_parser`, `name`, `sub_name?`, `account_nickname_validation?`, `region?`, `code`, `slug`, `status` (`active | inactive`), `order_form_fields: { key: string; label?: string; required?: boolean }[]` (the buyer-facing dynamic field definitions), `logo_url?`, `description?`, `meta_title?`, `meta_description?`, `og_image_url?`, `meta_keywords?: string[]`, `meta_robots?`, `created_at`, `updated_at`. Global entity references (`Game`, `Product`) may link to a category later; keep this feature-local until that link is actually built.
- **SubCategory** (§4.5) — feature-local to `features/categories/types/`: `id`, `category_id` (parent `Category` reference), `name`, `currency_name` (the reference's mislabeled second "Name" column — e.g. "Diamonds"), `logo_url?`, `description?`, `status` (`active | inactive`), `created_at`, `updated_at`.
- **CategoryType** (§4.5) — feature-local to `features/categories/types/`: `id`, `name`, `is_voucher: boolean` (the add-form's checkbox, drives the list's "Voucher" column), `status` (`active | inactive`), `created_at`, `updated_at`.
- **CategoryServer** (§4.5) — feature-local to `features/categories/types/`: `id`, `name`, `options: { name: string; value: string }[]` (the "+ Add Option" repeatable pair list), `created_at`, `updated_at`. No status field — this entity has no active/inactive concept.
- **CategoryProvider** (new, §4.5 — completes the categories feature's five tabs) — feature-local to `features/categories/types/`: `id`, `provider_name` (references the same supplier names used in `§4.2`/`§4.4`), `category_id` (parent `Category` reference), `provider_template`, `created_at`, `updated_at`. No status field confirmed in the reference — add one only if the Figma frame turns out to show a Status column not visible in the crop.

Shared API envelopes (single vs. list) are defined in `system_architecture.md §1`.

---

## 7. Non-Functional Requirements & Constraints

- **Typed service boundary:** components consume typed service hooks (TanStack Query); services wrap real HTTP behind that interface. The boundary stays even though the mock phase is over — it is what keeps a contract change from reaching components.
- **Server-side tables:** every large list (transactions, ledger) is paginated/filtered/sorted server-side (params → API), typed against the Laravel-paginator response shape.
- **Uploads:** later modules use **multipart to the backend** (no S3 yet).
- **Real-time:** where freshness matters (e.g. transaction status), use **TanStack Query polling** (`refetchInterval`) that stops on terminal states — no websockets this phase.
- **Design fidelity:** monochrome shadcn `neutral`; Inter for all text; tokens only (no raw hex); light + dark (dark default). See `design_system.md`.
- **Accessibility:** WCAG AA contrast, keyboard-navigable tables/menus/dialogs, visible focus rings.
- **Definition of Done:** per `system_architecture.md §7`.

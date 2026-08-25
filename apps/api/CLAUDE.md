# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
# First-time setup
composer run setup

# Development (runs server + queue worker + pail log viewer + vite concurrently)
composer run dev

# Run all tests (uses in-memory SQLite — no DB setup needed)
composer run test

# Fallback when the sqlite PDO driver is unavailable (`could not find driver`).
# Requires php8.4-sqlite3 normally; this runs the same suite against MySQL
# instead, which also matches production's driver more closely.
#   mysql -e "CREATE DATABASE IF NOT EXISTS web_topup_api_test;"
DB_CONNECTION=mysql DB_DATABASE=web_topup_api_test php artisan test

# Run a single test file or filter
php artisan test tests/Feature/ExampleTest.php
php artisan test --filter=CheckoutTest

# Code style fix (Laravel Pint)
./vendor/bin/pint

# Queue worker (standalone, for production-like local testing)
php artisan queue:listen --tries=3 --timeout=60

# Migrations
php artisan migrate
php artisan migrate:fresh --seed
```

---

## Architecture

### The Mandatory Data Flow

Every request must follow this exact pipeline — no exceptions:

```
Route → FormRequest (validation) → Controller (maps DTO) → Action (business logic) → ApiResponse
```

- **Controllers** are pure routers. They validate, build a DTO, call one Action, and return. No DB calls, no conditionals, no business logic.
- **Actions** own all logic. One Action = one task. They receive a DTO, run inside `DB::transaction()` where state changes are involved, and return a plain array or model.
- **DTOs** are `readonly` PHP 8.2+ value objects. They are the only thing passed between Controller and Action.
- **`ApiResponse` trait** (`app/Traits/ApiResponse.php`) is used in all controllers: `successResponse()`, `errorResponse()`, `validationErrorResponse()`, `paginatedResponse()`. Every paginated `index()` returns `paginatedResponse(XResource::collection($paginator), $message)` so all list endpoints share one shape: `{status, code, message, data: {data, links, meta}}`. `validationErrorResponse()`'s shape (`{status:"fail", code:422, message, errors}`) is also what `bootstrap/app.php`'s `withExceptions()` renders for every `ValidationException` on API routes — don't let a controller's manual 422 drift from it.
- Admin-only middleware: `EnsureUserIsAdmin` (aliased as `admin` in `bootstrap/app.php`) matches the authenticated user's `role()->name` against `App\Enums\RoleType::ADMIN` (case-insensitively) — not a hardcoded `role_id`, since role ids aren't guaranteed stable outside the seeded prod data. Applied to the whole admin-management route group in `routes/api.php`; `GET /v1/user` and `PATCH /v1/users/sync-timezone` stay on plain `auth:sanctum` for any authenticated caller.

### Notable Deviation: CheckoutController

`CheckoutController` validates inline (not via a FormRequest class) because its validation rule for `guest_contact` is dynamic — `required` for guests, `nullable` for authenticated users. This is an intentional exception to the FormRequest convention.

---

## Domain: Checkout & Payment Flow

### Checkout (`POST /v1/checkout`) — public, no auth

1. Duplicate-submit guard: an atomic `Cache::add` fingerprint rejects an identical checkout within 15s; the key is released on failure so a rejected attempt can retry immediately.
2. Resolves User (nullable for guests), Product (with active SupplierProducts eager-loaded, `status` must be true), PaymentChannel.
3. Price is role-resolved: `vip → reseller → agent → member → guest` (guests receive `price_member`).
4. Margin guard: aborts if `selling_price - supplier_price < 0`. The price/margin are frozen into the Transaction row at checkout — a later supplier price change (daily sync) is margin variance, not a correctness bug.
5. Creates `Transaction` (status: `PENDING`) then `Payment` (status: `'1'`) inside a single `DB::transaction()`.
6. **Balance path** (`channel_code === 'balance'`): locks the user row FOR UPDATE, deducts `user->balance`, marks Payment `'3'`, calls `ProcessUxiotopupTransactionAction` synchronously.
7. **External path**: calls `MonetapayService::createTransaction()`, returns `qr_string` or `virtual_account` to the client.

Rate limiting (named limiters in `AppServiceProvider`): `throttle:checkout` (10/min) on checkout + postpaid endpoints, `throttle:webhooks` (120/min per IP) on all callback routes, `throttle:login` (5/min per IP), and a global `throttle:api` (120/min) via `bootstrap/app.php`.

### Transaction Status Machine

```
PENDING → PAID → PROCESSING → COMPLETED
        ↘                   ↘ FAILED_PROVIDER → (auto-refund if applicable)
         EXPIRED
```

- `EXPIRED` — payment window timed out; customer never paid (set by Monetapay callback or `payments:sync-expired`).
- `FAILED_PROVIDER` — customer paid; the uxiotopup supplier failed to fulfil the order (status `cancel`/`refund`).

Statuses are backed enums cast on the models: `App\Enums\TransactionStatus` (values are the exact uppercase strings above) and `App\Enums\PaymentStatus`. `$model->status` returns the enum instance — compare against enum cases, never raw strings; JSON output is unchanged (enums serialize to their values).

### Payment Status Codes (`App\Enums\PaymentStatus`, stored as string in `payments.status`)

| Value | Enum case | Meaning |
|---|---|---|
| `'1'` | `PENDING` | Pending |
| `'2'` | `EXPIRED` | Expired / Failed |
| `'3'` | `SUCCESS` | Success |
| `'4'` | `REFUNDED` | Refunded |

### Refunds

`RefundFailedTransactionAction` is idempotent (row lock + `PaymentStatus::SUCCESS` check). Wallet refunds lock the user row and credit inline; gateway refunds dispatch `RefundGatewayJob` (5 tries, escalating backoff, deterministic `RFD-{reference_id}` order number) — exhausted retries alert Discord for manual follow-up.

---

## External Integrations

### Monetapay (Payment Gateway)

**Do not alter the cryptography logic** in `MonetapayService` — it is stabilized against the official PHP SDK.

Key points:
- AES-128-CBC with `"\0"` null-byte padding (not `"0"` char) via `str_pad($value, 16, "\0")`.
- Outbound signature: `md5(md5(TOKEN + "*|*" + sortedParams + "@!@" + timestamp))`.
- Inbound callback: same Double MD5 algorithm, verified via `verifyCallbackSignature()` using `hash_equals()`.
- Endpoint selection is driven by `payment_type` on `PaymentChannel`: `'qris'` → `/v1.0.0/qris`, anything else → `/v1.0.0/virtual_account`.
- Config keys: `services.monetapay.{mch_id, collection_app_id, disbursement_app_id, partner_key, token, aes_key, aes_iv, is_production}`.
- Three distinct identifiers — do not conflate them: `mch_id` is the merchant identity (only sent where the gateway expects a real `mch_id`/`parent_app_id`, e.g. `merchant_permission`, `sub_merchant`); `collection_app_id` is the pay-in `app_id` (checkout/`createTransaction`, refund, and all collection inquiries); `disbursement_app_id` is the payout `app_id`.
- `collection_app_id` has **no fallback** — set `MONETAPAY_COLLECTION_APP_ID` explicitly per environment or collection calls sign with a blank `app_id`.
- `disbursement_app_id` is used exclusively by payout methods (7.x: createDisbursement, createLargePayout, createEwalletPayout, inquiryDisbursement, plus the account-validation pre-payout check); defaults to `mch_id` if unset.

### Withdrawal / Payout (Monetapay disbursement)

Two-stage: a merchant (`payment-admin`) requests a payout; kita (`payment-internal`)
approves it. `CreateWithdrawalRequestAction` holds the full `amount` via `WalletLedger`
at request time and freezes `fee`/`nett`.

- **Fee** = `services.withdrawal.fee_flat + round(fee_flat * fee_percent/100)` — a flat
  charge, **amount-independent** (default `1500 + 11% of 1500 = 1665`). `nett = amount - fee`
  (the merchant is disbursed `nett`; `fee` is kita's markup booked to the platform ledger on
  final success). `services.withdrawal.min_amount` (default 10.000) floors the request so
  `nett` stays positive — enforced by `StoreWithdrawalRequest` and re-guarded in the action.
- **Approve `manual`** → `SETTLED` immediately, fee booked (`WithdrawalFeeLedger::credit`).
- **Approve `monetapay`** → `ProcessWithdrawalPayoutJob` calls `createDisbursement`. A
  successful create only *accepts* the payout (create-response `status:0` = Processing), so
  the job leaves the row **`PROCESSING`** and books **no** fee yet. Job-`failed()` (create
  rejected / retries exhausted) refunds the hold and marks `FAILED`.
- **Final result is async**: `POST /disbursement/merchant/callback` (public, `throttle:webhooks`,
  `DisbursementCallbackController` → `HandleDisbursementCallbackAction`) decrypts+verifies the
  same way as the pay-in callback, then maps Monetapay `status`: `1`→`SETTLED` + fee booked,
  `2`→`FAILED` + hold refunded, `0`→stay `PROCESSING`. Idempotent — a row already terminal is a
  no-op, so retries never double-book a fee or double-refund. Covered by `WithdrawalTest` and
  `DisbursementCallbackTest`.

### uxiotopup (Product Supplier)

- Auth: a single `api_key` sent in every JSON request body (no signing, no dev/prod key split). The caller's server IP must additionally be whitelisted in the uxiotopup dashboard, or every call fails.
- Endpoints (all POST JSON to `UXIOTOPUP_BASE_URL`, default `https://api.uxiotopup.id`): `/service` (price list), `/order`, `/status`, `/saldo`. Errors come back as HTTP 200 with `{status:false, msg}` — `UxiotopupService` rejects those envelopes rather than passing them through.
- `target` sent to uxiotopup = pipe-joined `target_uid|target_server` (just the uid when there is no server) — composed by `CustomerNumberFormatter` from `categories.order_form_fields` templates like `{user_id}|{zone_id}`.
- `invoice_number` is used as the uxiotopup `idtrx`. The order response's `data.id` is uxiotopup's OWN invoice and is persisted to `transactions.supplier_trx_id` — it is the only key `/status` accepts (there is no lookup by idtrx). `keterangan` carries the SN.
- `kontak` (phone) is required on `/order`: member phone → `guest_contact` → `'0000000000'` fallback.
- Duplicate `idtrx` ("idtrx sudah ada") means a previous attempt already placed the order — `UxiotopupDuplicateOrderException` is caught in `ProcessUxiotopupTransactionAction`, which settles the row to PROCESSING and waits for the callback instead of re-ordering or refunding.
- Supplier cost = the configured tier column from `/service` (`UXIOTOPUP_PRICE_TIER`: harga | harga_gold | harga_silver | harga_pro, default `harga`).
- Config keys: `services.uxiotopup.{api_key, base_url, callback_url, price_tier, callback_ips}`.
- Inbound webhook (`POST /v1/uxiotopup/callback`) carries **no signature** — authenticated only by source IP against `UXIOTOPUP_CALLBACK_IP` (comma-separated; default `103.146.202.50`). TrustProxies must be correct behind a LB or `$request->ip()` rejects every callback. Payload is flat: `{id, idtrx, keterangan, status, url_cb}`; statuses `pending|processing|paid` → PROCESSING, `success` → COMPLETED, `cancel|refund` → FAILED_PROVIDER (+refund).

### Discord (Operational Notifications)

- All Discord sends go through `App\Services\DiscordWebhookService` (`sendEmbed`/`sendAlert`) — never `Http::post` a webhook URL directly.
- Silently no-ops (and never throws) if `services.discord.webhook_log_url` is not set — safe to omit in dev.
- Used by: uxiotopup status transitions, the manual price-check report, `RefundGatewayJob::failed`, and scheduler `onFailure` alerts.

---

## uxiotopup Price Checker & Manual Product Management

Core principle: **supplier cost is fact (auto-updated), selling price auto-follows the configured margin rules unless the admin locks it, products are never auto-created**. Full admin guide: `docs/uxiotopup-product-management.md`.

### 5-minute price checker

`uxiotopup:check-prices` (scheduled `everyFiveMinutes` in `routes/console.php`, Discord alert only on failure) runs `CheckUxiotopupPricesAction`:

- Fetches the price list (warming the shared cache `uxiotopup:price-list`, TTL 300s — `UxiotopupService::getPriceListCached()` / `findServiceInPriceList()` read it). `supplier_products.buyer_sku_code` stores the uxiotopup service `id`.
- Updates `supplier_products` cost/availability via chunked `upsert()` on `(supplier_id, buyer_sku_code)`. Availability = `status === "aktif"`, mirrored into both `buyer_product_status` and `seller_product_status`. Postpaid/pasca is gone — uxiotopup is prepaid-only.
- **Availability**: unavailable SKUs get `is_active = false` + `sync_deactivated_at` stamp; only stamped rows are ever auto-reactivated, so a manual admin deactivation is never overridden.
- **Cost changes auto-reprice** a LIVE mapped product (`product_id` set + `is_active`): selling prices are recomputed from the margin rules via `ProductRepricer` (shared with the manual "Uxiotopup Update" so the two never drift), `products.price_modal` follows cost, and a `price_change_logs` row `applied` is written. Pooled rows (no product) are never repriced/logged — their cost still updates and their preview prices move with it.
- **Locked prices** (`products.is_price_locked`) are NOT repriced — a `locked` log row is written so the admin can review the shifted margin. (NB: read `products.is_price_locked`, not the separate/unsynced `supplier_products.is_price_locked` — known drift, do not "fix" here.)
- **Needs-attention log rows**: `deactivated` (SKU went inactive at the provider) and `negative_margin` (after markup + `price_max` clamp, member price is still below cost). Everything is append-only — a cost that moves twice leaves two rows; there is no dedupe/acknowledge.
- **Never** creates products (unknown SKUs are only counted/sampled in the report).
- Report DTO: `PriceCheckReportDTO` (total_fetched, price_changed, repriced, locked, negative_margin_count, deactivated_logged, deactivated/reactivated, negative_margin detail, unknown_count/sample).

`uxiotopup:sync-products` (name kept; also `POST /v1/uxiotopup/sync-products`) is the **manual** run of the same action with a console table + Discord report — it does not auto-create products.

### Manual product creation

- `GET /v1/uxiotopup/sku-preview` — previews a service from the cached price list (name/category/cost/availability, `already_mapped`, `suggested_prices` from `PricingService`).
- `POST /v1/uxiotopup/products` — `CreateUxiotopupProductAction`: creates Product (price_modal = uxiotopup tier cost) + SupplierProduct mapping; admin supplies all 4 selling prices. Business-rule failures throw `App\Exceptions\UxiotopupProductException` → 422.
- `POST /v1/uxiotopup/products/import` — Excel bulk import (`ImportUxiotopupProductsAction`, PhpSpreadsheet): headers matched by NAME on row 1 (`buyer_sku_code, category_code, name, code, price_member..price_agent, status`), max 500 rows, per-row validation + transaction so bad rows never abort the batch; blank prices default from `PricingService`.
- `GET /v1/uxiotopup/products/import-template` — generated xlsx (sheet "Produk" + "Petunjuk" with live category codes). **Binary response — intentional deviation from the ApiResponse envelope.**
- `GET /v1/uxiotopup/price-change-logs` — paginated read-only audit trail of the checker's actions (filters: `status` = applied|locked|deactivated|negative_margin|all, `search` name/sku, `date_from`/`date_to`). Replaces the old manual price-alert acknowledge endpoints.

`products.auto_price` was **dropped** — category is always explicit admin input. `PricingService` + `pricing-rules` CRUD remain for suggested/default prices only (member 20 / vip 15 / reseller 10 / agent 5 % built-in fallback).

---

## Async Job: `ProcessUxiotopupTopup`

Dispatched by `HandleMonetapayCallbackAction` after a successful Monetapay payment. Configured with `$tries = 3`, `$backoff = 30` seconds.

Flow inside the job:
1. Sets Transaction → `PROCESSING`.
2. Calls `ProcessUxiotopupTransactionAction::execute(Transaction)` — places the `/order`, persists `supplier_trx_id`; a duplicate-idtrx reject is settled to PROCESSING (never retried/refunded, the callback finalises it).
3. On infrastructure exception: re-throws so the queue retries; `failed()` marks `FAILED_PROVIDER` + refunds after all retries are exhausted.

Queue driver is `database` by default (`QUEUE_CONNECTION=database`). Tests run with `sync`.

---

## Service Billing (payment page)

A client (`payment-admin`) subscribes to a service kita sells. The bill is a
`service_invoices` row; **the payment is a separate `service_invoice_payments`
row, one per attempt.** They are separate because a bill outlives its payment —
a virtual account expires in 600s while `due_at` is three days out — so
re-opening a payment is the normal case, not an edge one.

- **`SRV-` is the third payable prefix.** `HandleMonetapayCallbackAction` routes
  by reference prefix before any lookup: `TOP-` → `balance_topups`, `SRV-` →
  `service_invoice_payments`, and the fall-through `PAY-` → `payments`. A new
  payable needs its own prefix and its own early-return branch; without one it
  falls into the checkout lookup, 500s, and Monetapay retries forever.
- **`ActivateServiceSubscriptionAction` is the only definition of "the client
  now has this service."** Both routes to paid call it — the webhook, and a
  payment-internal user marking a bill paid by hand — so the renewal-stacking
  rule cannot fork.
- **The manual confirm/reject stays** as the fallback for a webhook that never
  arrived or a client who paid outside the gateway.
- **Admin fee is the storefront top-up formula**: `fee_flat + round(amount ×
  fee_percent/100)`, added on top and frozen onto the attempt. The bill's
  `amount` never changes.
- **The wallet channel cannot pay a service bill.** A merchant's settlement
  balance is money kita owes it, not a way to pay kita back.
- **`service-payments:sync-expired`** (every 5 min) sweeps stale attempts.
  `payments:sync-expired` cannot: it joins `whereHas('transaction')` and a
  service payment owns no transaction. Its recovery half matters — a client
  whose webhook was lost has genuinely paid.
- `OpenServiceInvoicePaymentAction` keeps `redirect_url`/`deeplink_url`, which
  `CheckoutAction`'s instruction filter drops — they are the only output of
  `createTransaction`'s e-wallet branch.
- `ServiceInvoiceStatus::WAITING_CONFIRMATION` is legacy: nothing produces it
  since the bukti-transfer flow was removed, but old rows still carry it.
- Covered by `tests/Feature/PaymentPage/ServiceInvoicePaymentTest.php` and
  `ServiceInvoiceWebhookTest.php` — the latter is the **only** Monetapay callback
  coverage in the repo; copy its envelope builder rather than re-deriving the
  signature.

---

## Image Uploads

Every image goes to disk through `App\Services\ImageOptimizer::store($file, $directory)` — the drop-in
replacement for `$file->store($dir, 'public')`. It returns the same relative path, so model columns,
`MediaUrl::for()` and the delete-the-old-file logic are unaffected.

- **Output is WebP**, quality 82, longest edge capped at 1920px (never upscaled), EXIF rotation baked in,
  alpha preserved. Tuned in `config/images.php` (`IMAGE_OPTIMIZE_ENABLED`, `IMAGE_WEBP_QUALITY`,
  `IMAGE_MAX_DIMENSION`, `IMAGE_MAX_MEGAPIXELS`) — no code change needed to retune.
- **It degrades, never fails.** SVG/ICO/PDF, animated GIFs, already-small WebP, absurd pixel counts, a GD
  without WebP, and any thrown error all fall back to storing the original bytes (with a log line for the
  failure paths). An upload must never 500 because the optimiser could not do its job.
- **Payment proofs are excluded on purpose** — `ManualReviewTransactionAction`,
  `MerchantServiceInvoiceController::uploadProof` and `FinanceWithdrawalController::approve` still call
  `->store()` directly. Proof is evidence; it is kept byte-for-byte as the customer submitted it. Do not
  "tidy" those three into the optimiser.
- Existing images are **not** backfilled; only new uploads are converted. Both extensions coexist fine
  because the path is read from the database.
- Requires the `gd` extension (and `exif` for JPEG orientation) — both are in the CI workflows' extension
  list, and `UploadedFile::fake()->image()` already depends on GD.
- Behaviour is pinned in `tests/Unit/ImageOptimizerTest.php`; the endpoint wiring in
  `tests/Feature/ImageUploadWebpTest.php`.

The browsers help but do not guarantee: `uxiotopup-admin` and `uxiotopup-fe` re-encode to WebP client-side
before uploading (same rules, same skips) so a phone photo does not have to travel as several MB. Anything
they skip is still handled here.

---

## Key Database Relationships

```
users (nullable) ──── transactions ──── payments ──── payment_channels
                           │
                     products ──── supplier_products ──── suppliers
                           │              │
             point_histories, ratings   price_change_logs
```

- `transactions.user_id` is nullable — guest checkouts are supported.
- `transactions.guest_contact` stores the WhatsApp/phone number for guests.
- `products` has five price columns: `price_modal` (cost), `price_member`, `price_vip`, `price_reseller`, `price_agent`.
- `payment_channels` carries three independent rates, all applied by `CheckoutAction` and all
  **frozen onto the transaction and payment rows at checkout** so a later rate change never
  rewrites a booked order:
  - `fee_flat` + `fee_percent` → the channel fee. This **is** the "Biaya Admin" the customer
    is charged (`amount_fee`/`channel_fee`); there is no second global markup. `admin_markup`
    is always written as `0` and is kept only so historical rows stay reconstructable.
  - `gateway_fee_flat` + `gateway_fee_percent` → Monetapay's own cut of the gross, recorded on
    `payments.gateway_fee` rather than read back from the callback. Settlement
    (`SettleMerchantTransactionAction`) reads it straight off the payment row.
  - `tax_percent` → PPN levied **on the channel fee only**. It is kita's expense, so it reduces
    platform profit at settlement and is deliberately **not** added to what the customer pays
    (`amount_total` is unchanged by it).
  So: customer pays `selling_price + channel_fee`; kita keeps `channel_fee - gateway_fee - tax_amount`.
- `supplier_products.is_active` is the gate — only the first active record is used per product.

---

## Public vs Protected Routes

Three tiers, all under `/api/v1`:

1. **Public** — the customer-facing storefront plus the gateway callbacks. `POST /v1/checkout`, `POST /v1/payment/callback` and `POST /v1/uxiotopup/callback` were always public; the storefront read endpoints below joined them.
2. **`auth:sanctum`** — `GET /v1/user`, `PATCH /v1/users/sync-timezone` and the whole `/v1/me/*` group. Any authenticated user.
3. **`auth:sanctum` + `admin`** — everything else (the back-office CRUD).

### Storefront API (public)

Consumed by the React client in `uxiotopup-fe`. Handlers resolve the caller with `$request->user('sanctum')` so a signed-in member gets their tier price, while guests still work.

| Endpoint | Notes |
|---|---|
| `GET /v1/games` | Sellable games only. `search`, `type_id`, `sort=name\|popular`, `per_page` |
| `GET /v1/games/{game}` | `{game}` binds via `Catalog::resolveGame` — slug, code **or** id. Includes `order_form_fields` |
| `GET /v1/games/{game}/products` | Denominations priced through `RolePrice` — the same ladder `CheckoutAction` charges |
| `GET /v1/games/{game}/reviews` | Paginated ratings + star breakdown; author + game id masked |
| `POST /v1/games/{game}/validate-id` | Nickname lookup. **Always 200** — see below |
| `GET /v1/payment-channels` | `balance` excluded for guests (checkout rejects it for them anyway) |
| `GET /v1/price-list` | `game` accepts a slug/code, not an id |
| `GET /v1/invoices/{invoiceNumber}` | Public receipt, polled every 5s. Narrow projection |
| `GET /v1/orders/track?query=` | Invoice number or exact phone. `throttle:checkout` |
| `GET /v1/storefront/{banners,announcements,leaderboard}` | **Prefixed on purpose** — `/v1/banners`, `/v1/announcements` and `/v1/leaderboard` are already admin routes, and Laravel's route collection is keyed on method+uri, so a same-path public route would silently replace the admin one |

Key invariants:

- **Never widen the public projections.** `ShowInvoiceAction`, `TrackOrdersAction` and `ListMemberTransactionsAction` build their arrays field-by-field rather than serializing a model, so `guest_contact`, `margin`, `price_modal` and supplier ids cannot leak by accident. Tests assert this.
- **`validate-id` must never fail a purchase.** Unconfigured game, unrecognised provider, provider timeout and provider 500 all resolve to `{nickname: null}` with a 200. A 4xx here would read on the client as a broken order form.
- **`Catalog` is the single definition of "sellable"** (active product + active supplier mapping). `TopupPageController` and every storefront endpoint go through it, so the catalog can never advertise an order checkout would reject.
- **`PaymentExpiry`** holds the per-channel expiry windows, shared by `payments:sync-expired` and the invoice endpoint's `expires_at`. Splitting them would let the customer's countdown disagree with the job that reaps the payment.
- **`CheckoutAction` persists the gateway instructions** into `payments.payment_data`. Without it the QR/VA exists only in the checkout response and a page refresh leaves the customer with nothing to pay against.
- **`POST /v1/checkout` has no auth middleware**, so `$request->user()` consults the `web` guard and cannot see a bearer token. `StoreCheckoutRequest::checkoutUser()` resolves through the `sanctum` guard instead — without it a signed-in member is booked as a guest and locked out of balance payment. `Sanctum::actingAs()` masks this in tests; the regression test in `StorefrontOrderTest` uses a real bearer header on purpose.

### Member self-service (`/v1/me`)

`GET|PUT /v1/me`, `PUT /v1/me/password`, `GET /v1/me/dashboard`, `GET /v1/me/transactions`, `GET /v1/me/activity-logs`, `POST /v1/me/transactions/{invoiceNumber}/rating`.

Every query is scoped to `user_id` **before** any filter is applied, so no filter combination can widen it to another customer's rows. The rating route is keyed on `invoice_number` — the only order identifier the storefront holds — and resolves inside the caller's own transactions, so someone else's invoice is indistinguishable from one that does not exist.

### Auth

`POST /v1/auth/register` always assigns the MEMBER role; role is never settable from the request body. `forgot-password` returns the same message whether or not the email exists (no `exists` rule, no differing response) so it cannot be used to enumerate accounts. `reset-password` revokes all existing tokens — a reset is the recovery path after a compromise.

## Required `.env` Keys Beyond Laravel Defaults

```
MONETAPAY_MCH_ID=
MONETAPAY_DISBURSEMENT_APP_ID=   # separate app_id for payout/disbursement (7.x); defaults to MONETAPAY_MCH_ID
MONETAPAY_PARTNER_KEY=
MONETAPAY_TOKEN=
MONETAPAY_AES_KEY=
MONETAPAY_AES_IV=
MONETAPAY_IS_PRODUCTION=false
MONETAPAY_SUCCESS_REDIRECT_URL=   # redirect after successful e-wallet / payment link payment
MONETAPAY_FAILED_REDIRECT_URL=    # redirect after failed payment link payment (optional)

WITHDRAWAL_FEE_FLAT=1500          # withdraw fee = flat + round(amount * percent/100); nett = amount - fee
WITHDRAWAL_FEE_PERCENT=11
WITHDRAWAL_MIN_AMOUNT=10000       # floor on the requested amount so nett stays positive

UXIOTOPUP_API_KEY=
UXIOTOPUP_BASE_URL=https://api.uxiotopup.id
UXIOTOPUP_CALLBACK_URL=        # points at {app}/api/v1/uxiotopup/callback; sent on every /order
UXIOTOPUP_PRICE_TIER=harga     # harga | harga_gold | harga_silver | harga_pro
UXIOTOPUP_CALLBACK_IP=103.146.202.50   # webhook source-IP allowlist (comma-separated)

DISCORD_WEBHOOK_LOG_URL=   # optional
```

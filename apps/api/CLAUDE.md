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
6. **Balance path** (`channel_code === 'balance'`): locks the user row FOR UPDATE, deducts `user->balance`, marks Payment `'3'`, calls `ProcessDigiflazzTransactionAction` synchronously.
7. **External path**: calls `MonetapayService::createTransaction()`, returns `qr_string` or `virtual_account` to the client.

Rate limiting (named limiters in `AppServiceProvider`): `throttle:checkout` (10/min) on checkout + postpaid endpoints, `throttle:webhooks` (120/min per IP) on all callback routes, `throttle:login` (5/min per IP), and a global `throttle:api` (120/min) via `bootstrap/app.php`.

### Transaction Status Machine

```
PENDING → PAID → PROCESSING → COMPLETED
        ↘                   ↘ FAILED_PROVIDER → (auto-refund if applicable)
         EXPIRED
```

- `EXPIRED` — payment window timed out; customer never paid (set by Monetapay callback or `payments:sync-expired`).
- `FAILED_PROVIDER` — customer paid; Digiflazz supplier failed to fulfil the order.

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

### Digiflazz (Product Supplier)

- Signature: `md5(username + key + refId)` — the formula is **mode-agnostic**; only the apiKey *value* differs between Development and Production. A wrong-mode key returns rc `41` ("Signature tidak valid").
- The apiKey is selected by `DIGIFLAZZ_PRODUCTION`: `true` → `prod_key`, `false` → `dev_key` (resolved in `DigiflazzService::__construct`). Both fall back to legacy `DIGIFLAZZ_KEY` if the mode-specific key is unset, so older envs keep working.
- `customer_no` sent to Digiflazz = `target_uid . target_server` (concatenated, no separator).
- `invoice_number` is used as the Digiflazz `ref_id`.
- Config keys: `services.digiflazz.{username, production, dev_key, prod_key, base_url, webhook_secret}`.
- Inbound webhook authenticated via HMAC-SHA1 on raw body against `X-Hub-Signature` header.

### Discord (Operational Notifications)

- All Discord sends go through `App\Services\DiscordWebhookService` (`sendEmbed`/`sendAlert`) — never `Http::post` a webhook URL directly.
- Silently no-ops (and never throws) if `services.discord.webhook_log_url` is not set — safe to omit in dev.
- Used by: Digiflazz status transitions, the manual price-check report, `RefundGatewayJob::failed`, and scheduler `onFailure` alerts.

---

## Digiflazz Price Checker & Manual Product Management

Core principle: **supplier cost is fact (auto-updated), selling price is the admin's decision (never auto-changed), products are never auto-created**. Full admin guide: `docs/digiflazz-product-management.md`.

### 5-minute price checker

`digiflazz:check-prices {--type=all}` (scheduled `everyFiveMinutes` in `routes/console.php`, Discord alert only on failure) runs `CheckDigiflazzPricesAction`:

- Fetches the price list (warming the shared cache `digiflazz:price-list:{prepaid|pasca}`, TTL 300s — `DigiflazzService::getPriceListCached()` / `findSkuInPriceList()` read it).
- Updates `supplier_products` cost/availability via chunked `upsert()` on `(supplier_id, buyer_sku_code)`. Pasca items store `admin` → `price`/`admin_fee` and `commission`.
- **Availability**: unavailable SKUs get `is_active = false` + `sync_deactivated_at` stamp; only stamped rows are ever auto-reactivated, so a manual admin deactivation is never overridden.
- **Cost changes** raise `price_change_alerts` rows (enum `App\Enums\PriceAlertStatus`). Dedupe: one pending alert per mapping — repeat changes update `new_price` (original `old_price` kept); a revert to `old_price` deletes the pending alert; acknowledged alerts stay as history and a later change creates a fresh pending row.
- **Never** creates products (unknown SKUs are only counted/sampled in the report) and **never** touches selling prices.
- Report DTO: `PriceCheckReportDTO` (type, total_fetched, price_changed, alerts_created/updated, deactivated/reactivated, negative_margin, unknown_count/sample).

`digiflazz:sync-products {--type=all}` (name kept; also `POST /v1/digiflazz/sync-products`) is the **manual** run of the same action with a console table + Discord report — it no longer auto-creates or reprices anything.

### Manual product creation

- `GET /v1/digiflazz/sku-preview` — previews a SKU from the cached price list (name/brand/cost/availability, `already_mapped`, `suggested_prices` from `PricingService`).
- `POST /v1/digiflazz/products` — `CreateDigiflazzProductAction`: creates Product (price_modal = Digiflazz cost) + SupplierProduct mapping; admin supplies all 4 selling prices. Business-rule failures throw `App\Exceptions\DigiflazzProductException` → 422.
- `POST /v1/digiflazz/products/import` — Excel bulk import (`ImportDigiflazzProductsAction`, PhpSpreadsheet): headers matched by NAME on row 1 (`buyer_sku_code, category_code, name, code, price_member..price_agent, status`), max 500 rows, per-row validation + transaction so bad rows never abort the batch; blank prices default from `PricingService`.
- `GET /v1/digiflazz/products/import-template` — generated xlsx (sheet "Produk" + "Petunjuk" with live category codes). **Binary response — intentional deviation from the ApiResponse envelope.**
- `GET/POST /v1/digiflazz/price-alerts...` — paginated alert list, `{id}/acknowledge` (idempotent), `acknowledge-all`.

`products.auto_price` was **dropped**; `config/digiflazz.php` (brand→category map) was **deleted** — category is always explicit admin input. `PricingService` + `pricing-rules` CRUD remain for suggested/default prices only (member 20 / vip 15 / reseller 10 / agent 5 % built-in fallback).

---

## Async Job: `ProcessDigiflazzTopup`

Dispatched by `HandleMonetapayCallbackAction` after a successful Monetapay payment. Configured with `$tries = 3`, `$backoff = 30` seconds.

Flow inside the job:
1. Sets Transaction → `PROCESSING`.
2. Calls `ProcessDigiflazzTransactionAction::execute(Transaction)`.
3. The action updates the Transaction status based on the Digiflazz sync response.
4. On infrastructure exception: marks `FAILED_PROVIDER` and **re-throws** so the queue can retry.

Queue driver is `database` by default (`QUEUE_CONNECTION=database`). Tests run with `sync`.

---

## Key Database Relationships

```
users (nullable) ──── transactions ──── payments ──── payment_channels
                           │
                     products ──── supplier_products ──── suppliers
                           │              │
             point_histories, ratings   price_change_alerts
```

- `transactions.user_id` is nullable — guest checkouts are supported.
- `transactions.guest_contact` stores the WhatsApp/phone number for guests.
- `products` has five price columns: `price_modal` (cost), `price_member`, `price_vip`, `price_reseller`, `price_agent`.
- `payment_channels` has `fee_flat` and `fee_percent` columns in the schema but `CheckoutAction` currently hardcodes `$adminFee = 0`. Extend there when fee logic is needed.
- `supplier_products.is_active` is the gate — only the first active record is used per product.

---

## Public vs Protected Routes

`POST /v1/checkout`, `POST /v1/payment/callback`, and `POST /v1/digiflazz/callback` are intentionally **public** (no `auth:sanctum`). All other management endpoints require authentication.

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

DIGIFLAZZ_USERNAME=
DIGIFLAZZ_KEY=
DIGIFLAZZ_BASE_URL=https://api.digiflazz.com/v1
DIGIFLAZZ_WEBHOOK_SECRET=

DISCORD_WEBHOOK_LOG_URL=   # optional
```

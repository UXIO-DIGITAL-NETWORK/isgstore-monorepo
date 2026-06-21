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
- **`ApiResponse` trait** (`app/Traits/ApiResponse.php`) is used in all controllers: `successResponse()`, `errorResponse()`, `validationErrorResponse()`.

### Notable Deviation: CheckoutController

`CheckoutController` validates inline (not via a FormRequest class) because its validation rule for `guest_contact` is dynamic — `required` for guests, `nullable` for authenticated users. This is an intentional exception to the FormRequest convention.

---

## Domain: Checkout & Payment Flow

### Checkout (`POST /v1/checkout`) — public, no auth

1. Resolves User (nullable for guests), Product (with active SupplierProducts eager-loaded), PaymentChannel.
2. Price is role-resolved: `vip → reseller → agent → member → guest` (guests receive `price_member`).
3. Margin guard: aborts if `selling_price - supplier_price < 0`.
4. Creates `Transaction` (status: `PENDING`) then `Payment` (status: `'1'`) inside a single `DB::transaction()`.
5. **Balance path** (`channel_code === 'balance'`): deducts `user->balance`, marks Payment `'3'`, calls `ProcessDigiflazzTransactionAction` synchronously.
6. **External path**: calls `MonetapayService::createTransaction()`, returns `qr_string` or `virtual_account` to the client.

### Transaction Status Machine

```
PENDING → PAID → PROCESSING → COMPLETED
                            ↘ FAILED_PROVIDER → (auto-refund if applicable)
```

All actions, jobs, and webhook handlers must use these exact uppercase constants.

### Payment Status Codes (stored as string in `payments.status`)

| Value | Meaning |
|---|---|
| `'1'` | Pending |
| `'2'` | Expired / Failed |
| `'3'` | Success |
| `'4'` | Refunded |

---

## External Integrations

### Monetapay (Payment Gateway)

**Do not alter the cryptography logic** in `MonetapayService` — it is stabilized against the official PHP SDK.

Key points:
- AES-128-CBC with `"\0"` null-byte padding (not `"0"` char) via `str_pad($value, 16, "\0")`.
- Outbound signature: `md5(md5(TOKEN + "*|*" + sortedParams + "@!@" + timestamp))`.
- Inbound callback: same Double MD5 algorithm, verified via `verifyCallbackSignature()` using `hash_equals()`.
- Endpoint selection is driven by `payment_type` on `PaymentChannel`: `'qris'` → `/v1.0.0/qris`, anything else → `/v1.0.0/virtual_account`.
- Config keys: `services.monetapay.{mch_id, partner_key, token, aes_key, aes_iv, is_production}`.

### Digiflazz (Product Supplier)

- Signature: `md5(username + key + refId)`.
- `customer_no` sent to Digiflazz = `target_uid . target_server` (concatenated, no separator).
- `invoice_number` is used as the Digiflazz `ref_id`.
- Config keys: `services.digiflazz.{username, key, base_url, webhook_secret}`.
- Inbound webhook authenticated via HMAC-SHA1 on raw body against `X-Hub-Signature` header.

### Discord (Operational Notifications)

- `HandleDigiflazzWebhookAction` sends embed notifications on every status transition.
- Silently skipped if `services.discord.webhook_log_url` is not set — safe to omit in dev.

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
                           │
                     point_histories, ratings
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
MONETAPAY_PARTNER_KEY=
MONETAPAY_TOKEN=
MONETAPAY_AES_KEY=
MONETAPAY_AES_IV=
MONETAPAY_IS_PRODUCTION=false
MONETAPAY_SUCCESS_REDIRECT_URL=   # redirect after successful e-wallet payment

DIGIFLAZZ_USERNAME=
DIGIFLAZZ_KEY=
DIGIFLAZZ_BASE_URL=https://api.digiflazz.com/v1
DIGIFLAZZ_WEBHOOK_SECRET=

DISCORD_WEBHOOK_LOG_URL=   # optional
```

# Referensi Rute API

Dulu halaman ini dilayani aplikasi di `GET /` (`resources/views/api-landing.blade.php`)
— terbuka untuk publik di `api.<domain>`, memuat peta lengkap rute admin,
payment-internal, dan Hub. Sekarang tempatnya di sini: dokumentasi tidak perlu
dilayani proses produksi, dan repo ini private.

`GET /` pada API kini hanya menjawab nama dan versi dari `.env`.

Semua rute berprefiks `/api`, jadi `/v1/ping` di bawah ini adalah
`https://api.<domain>/api/v1/ping`. Sumber kebenarannya tetap
`apps/api/routes/api.php`; berkas ini peta bacaannya.

---

## System — Public

Liveness probes for load balancers and uptime monitors — no auth, no side effects.

### Health checks

Both return `200` with a tiny JSON body; `/health` also reports request latency in ms.

- `GET /v1/ping`
- `GET /v1/health`

## Payment Webhooks — Webhook

Inbound callbacks from Monetapay (pay-in, disbursement, subscription) and the uxiolabs supplier. Public routes, throttled per IP — the real gate is the signature / source-IP check inside each handler.

### Monetapay pay-in

Double-MD5 signed. Point the VA / e-wallet / QRIS callback URL at any of these — same decrypt + verify + dispatch flow.

- `POST /v1/payment/callback`
- `POST /v1/monetapay/va/callback`
- `POST /v1/monetapay/ewallet/callback`
- `POST /v1/monetapay/qris/callback`

### Monetapay lifecycle

Disbursement result drives a withdrawal to SETTLED / FAILED; subscription events drive activation cycles.

- `POST /v1/disbursement/merchant/callback`
- `POST /v1/monetapay/subscription/callback/active`
- `POST /v1/monetapay/subscription/callback/deduct/before`
- `POST /v1/monetapay/subscription/callback/deduct/after`

### Uxiolabs supplier

Order fulfilment result. Authenticated by source IP (no signature) — finalises the transaction to COMPLETED / FAILED_PROVIDER.

- `POST /v1/uxiolabs/callback`

## Storefront — Public

The customer-facing catalog and checkout consumed by the React SPA. Anonymous, but each handler reads the bearer token when present, so a signed-in member is quoted their own tier price. Projections are deliberately narrow — `margin`, `price_modal` and supplier ids never leak.

### Catalog

`{game}` resolves by slug, code or id. Prices run through the same role ladder checkout charges.

- `GET /v1/games`
- `GET /v1/games/{game}`
- `GET /v1/games/{game}`
- `GET /v1/games/{game}`
- `POST /v1/games/{game}`
- `GET /v1/price-list`

### Checkout & receipts

Checkout is public (guest or member). Invoices are polled every 5s; order tracking takes an invoice number or phone.

- `POST /v1/checkout`
- `GET /v1/invoices/{invoiceNumber}`
- `GET /v1/invoices/{invoiceNumber}`
- `GET /v1/orders/track`
- `POST /v1/transactions/{invoiceNumber}`

### Content & marketing

Prefixed `/storefront` on purpose — the admin group already owns the un-prefixed paths.

- `GET /v1/storefront/banners`
- `GET /v1/storefront/announcements`
- `GET /v1/storefront/leaderboard`
- `GET /v1/storefront/articles`
- `GET /v1/storefront/faqs`
- `GET /v1/storefront/testimonials`
- `GET /v1/storefront/settings`
- `GET /v1/storefront/pages/{slug}`
- `GET /v1/storefront/payment-channels`
- `GET /v1/storefront/flash-sale`
- `GET /v1/storefront/promos`
- `POST /v1/storefront/promos/validate`
- `GET /v1/storefront/membership-plans`

## Authentication — Public

Sanctum token issue and account recovery. Registration always assigns the MEMBER role — role is never settable from the body. `forgot-password` gives the same response whether or not the email exists (no enumeration).

### Sessions & recovery

All throttled per IP. `logout` requires a valid bearer token; `reset-password` revokes every existing token.

- `POST /v1/auth/login`
- `POST /v1/auth/google`
- `POST /v1/auth/register`
- `POST /v1/auth/refresh`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/logout`

## Member Self-Service — Authenticated

Everything a signed-in customer can see or change about themselves under `/v1/me`. Every query is scoped to the caller's `user_id` before any filter, so no filter combination can reach another customer's rows.

### Profile & activity

Current user, timezone sync, dashboard, order history and the per-order rating.

- `GET /v1/user`
- `PATCH /v1/users/sync-timezone`
- `GET /v1/me`
- `PUT /v1/me`
- `PUT /v1/me/password`
- `GET /v1/me/dashboard`
- `GET /v1/me/transactions`
- `POST /v1/me/transactions/{invoiceNumber}`
- `GET /v1/me/activity-logs`

### Wallet & membership

Balance top-ups open a real payment (throttled like checkout), plus loyalty-tier subscription.

- `GET /v1/me/topups`
- `POST /v1/me/topups`
- `GET /v1/me/topups/{reference}`
- `GET /v1/me/balance-mutations`
- `GET /v1/me/membership`
- `POST /v1/me/membership/subscribe`

### Integration credentials

Personal API keys for members who resell through their own systems.

- `GET /v1/me/api-credentials`
- `POST /v1/me/api-credentials`
- `PUT /v1/me/api-credentials/{id}`
- `POST /v1/me/api-credentials/{id}`
- `DEL /v1/me/api-credentials/{id}`

## Admin Management — Admin

The back-office CRUD — `auth:sanctum` + the `admin` role gate. Catalog, pricing, content, the uxiolabs price checker and the Monetapay operator tools all live here.

### Users & overview

User CRUD with audited wallet adjustments, plus dashboard, financial and reporting aggregates.

- `GET /v1/users`
- `POST /v1/users/{user}`
- `GET /v1/dashboard/stats`
- `GET /v1/dashboard/performance`
- `GET /v1/financial/summary`
- `GET /v1/reports/summary`
- `GET /v1/activity-logs`
- `GET /v1/integration/channels`

### Master data

Category taxonomy, suppliers and the product / supplier-product catalog (with bulk pipelines).

- `GET /v1/category-types`
- `GET /v1/categories`
- `GET /v1/sub-categories`
- `GET /v1/server-categories`
- `GET /v1/suppliers`
- `GET /v1/products`
- `POST /v1/products/bulk-create`
- `GET /v1/supplier-products`
- `POST /v1/supplier-products/bulk/promote-publish`
- `GET /v1/pricing-rules`

### Uxiolabs tools

Supplier balance, the manual price sync, pooled-SKU onboarding and the auto-repricer audit trail.

- `GET /v1/uxiolabs/balance`
- `POST /v1/uxiolabs/sync-products`
- `GET /v1/uxiolabs/price-list`
- `GET /v1/uxiolabs/pool-candidates`
- `GET /v1/uxiolabs/sku-preview`
- `POST /v1/uxiolabs/products`
- `POST /v1/uxiolabs/products/import`
- `GET /v1/uxiolabs/price-change-logs`

### Monetapay operator

Read-only inquiries mirroring the Monetapay spec, plus state-changing cancel / refund.

- `POST /v1/monetapay/balance`
- `POST /v1/monetapay/payin/query`
- `POST /v1/monetapay/disbursement/create`
- `POST /v1/monetapay/disbursement/query`
- `POST /v1/monetapay/inquiry-account`
- `POST /v1/monetapay/cancel`
- `POST /v1/monetapay/refund`

### Transactions & payments

Full transaction lifecycle control — export, recap, manual review, refund, retry and callback replay.

- `GET /v1/transactions`
- `GET /v1/transactions/export`
- `POST /v1/transactions/{id}`
- `POST /v1/transactions/{id}`
- `POST /v1/transactions/{id}`
- `GET /v1/payments`
- `GET /v1/ratings`
- `GET /v1/point-histories`

### Content & marketing

CMS resources plus the storefront's banners, announcements, flash sales and promos.

- `GET /v1/articles`
- `GET /v1/faqs`
- `GET /v1/pages`
- `GET /v1/testimonials`
- `GET /v1/banners`
- `GET /v1/announcements`
- `GET /v1/flash-sales`
- `GET /v1/promos`
- `GET /v1/membership-plans`
- `GET /v1/payment-channels`
- `GET /v1/settings`

## Payment Page · Merchant — Merchant

The client's own view under `/v1/payment-admin` (`payment-admin` role). Every handler additionally scopes to the caller's id, so the role gate is defence-in-depth. A merchant sees its own sales, requests withdrawals and pays for the services it subscribes to.

### Dashboard & money

Sales, mutations, and the two-stage withdrawal request (holding period applies).

- `GET /v1/payment-admin/dashboard`
- `GET /v1/payment-admin/transactions`
- `GET /v1/payment-admin/transactions/summary`
- `GET /v1/payment-admin/mutations`
- `GET /v1/payment-admin/withdrawals`
- `POST /v1/payment-admin/withdrawals`

### Services & invoices

Browse the catalog kita sells, view subscriptions and settle bills — a bill can always be re-paid until due.

- `GET /v1/payment-admin/services`
- `GET /v1/payment-admin/service-subscriptions`
- `GET /v1/payment-admin/payment-channels`
- `GET /v1/payment-admin/service-invoices`
- `POST /v1/payment-admin/service-invoices`
- `POST /v1/payment-admin/service-invoices/{id}`

### Installation & status

Read-only view of kita's setup work; `reveal` is POST so credentials aren't proxy-cached.

- `GET /v1/payment-admin/service-subscriptions/{id}`
- `POST /v1/payment-admin/installation-details/{id}`
- `GET /v1/payment-admin/service-status`

## Payment Page · Internal — Internal

Kita's cross-merchant view under `/v1/payment-internal` (`payment-internal` role): every merchant's data, withdrawal verification, per-channel fee settings, the service catalog it sells and the installation work behind each subscription.

### Overview & withdrawals

Cross-merchant dashboard, notifications, and the approve / reject leg of every payout.

- `GET /v1/payment-internal/dashboard`
- `GET /v1/payment-internal/notifications`
- `GET /v1/payment-internal/merchants`
- `GET /v1/payment-internal/transactions`
- `GET /v1/payment-internal/withdrawals`
- `POST /v1/payment-internal/withdrawals/{id}`
- `POST /v1/payment-internal/withdrawals/{id}`
- `GET /v1/payment-internal/platform-balance`

### Channels & services

Per-method fees (the "Biaya Admin"), the service catalog, subscriptions and manual bill verification.

- `GET /v1/payment-internal/channels`
- `PUT /v1/payment-internal/channels/{id}`
- `GET /v1/payment-internal/services`
- `GET /v1/payment-internal/service-invoices`
- `POST /v1/payment-internal/service-invoices/{id}`
- `GET /v1/payment-internal/service-subscriptions`

### Installation & incidents

The install window, milestone checklist and stored credentials, plus the incidents driving the status page.

- `GET /v1/payment-internal/service-subscriptions/{id}`
- `POST /v1/payment-internal/installations/{id}`
- `POST /v1/payment-internal/installations/{id}`
- `GET /v1/payment-internal/incidents`

## Uxio Hub — Hub

Read-only summaries the central Uxio Hub pulls on a schedule. Gated by `X-Hub-Key` (+ optional IP allowlist) — dead when no key is configured, so a standalone deployment exposes nothing. Additive-only contract: fields may be added, never renamed or removed.

### Reporting contract

Consolidated per-site figures the Hub aggregates across every deployment.

- `GET /v1/hub/summary`
- `GET /v1/hub/withdrawals`
- `GET /v1/hub/service-orders`
- `GET /v1/hub/profit`
- `GET /v1/hub/channels`


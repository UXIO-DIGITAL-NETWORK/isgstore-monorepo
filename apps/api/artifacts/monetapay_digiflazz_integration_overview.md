# Monetapay & Digiflazz Integration Overview
**Project:** Uxio Web Top-Up API  
**Stack:** Laravel 11 · PHP 8.2 · Sanctum · Laravel Queues  
**Scope:** Phases 1–3 refactor completed May 2026

---

## Table of Contents
1. [AES Cryptography Fix (Phase 1)](#1-aes-cryptography-fix-phase-1)
2. [Streamlined Payment Method Routing (Phase 2)](#2-streamlined-payment-method-routing-phase-2)
3. [Secure Webhook Processing (Phase 2)](#3-secure-webhook-processing-phase-2)
4. [Asynchronous Digiflazz Fulfillment (Phase 3)](#4-asynchronous-digiflazz-fulfillment-phase-3)
5. [Complete End-to-End Flow](#5-complete-end-to-end-flow)
6. [Transaction Status State Machine](#6-transaction-status-state-machine)
7. [Modified & Created Files](#7-modified--created-files)

---

## 1. AES Cryptography Fix (Phase 1)

### The Problem
The original `MonetapayService` padded the AES key and IV using the string character `"0"` (ASCII 48). The official Monetapay PHP SDK uses null-byte `"\0"` (ASCII 0) padding, producing a different 16-byte key and therefore a different ciphertext.

### The Fix

| Concern | Before | After |
|---|---|---|
| Padding char | `$sb .= "0"` (ASCII 48) | `str_pad($value, 16, "\0")` (ASCII 0) |
| Key/IV scope | Pre-computed in `__construct`, stored as properties | Derived per-call inside each crypto method |
| `decryptPayload()` | Did not exist (callback controller was broken) | Added — `openssl_decrypt` → `json_decode` → `array` |

### Implementation — `deriveAesParam()`
```php
private function deriveAesParam(?string $value): string
{
    // Matches official SDK: str_pad to 16 bytes with null chars, substr enforces ceiling
    return substr(str_pad((string) $value, 16, "\0"), 0, 16);
}
```

Both `encryptPayload()` and `decryptPayload()` call `deriveAesParam()` directly from config, keeping the key derivation stateless and consistent with the SDK's static helper pattern.

---

## 2. Streamlined Payment Method Routing (Phase 2)

### Architecture Decision
Payment method routing is **fully data-driven**. The `payment_channels` table drives every branching decision — no hardcoded channel names exist in business logic beyond the single `balance` guard.

### Routing Logic in `CheckoutAction`

```
POST /v1/checkout
    │
    ├─ channel_code === 'balance'
    │       └─ Deduct user->balance
    │          Mark payment status = '3' (Success)
    │          → ProcessDigiflazzTransactionAction [synchronous]
    │
    └─ Any other channel (QRIS, Virtual Account, etc.)
            └─ MonetapayService::createTransaction()
               │  payment_type === 'qris'  → POST /v1.0.0/qris
               │  payment_type === 'va'    → POST /v1.0.0/virtual_account
               └─ Returns { qr_string } or { virtual_account, bank_code }
```

The `payment_type` column on `payment_channels` is the sole discriminator passed into `MonetapayService`. Adding a new channel (e.g., e-wallet) only requires a new row in `payment_channels` — no PHP changes.

---

## 3. Secure Webhook Processing (Phase 2)

### Inbound Callback Verification Chain

```
POST /v1/payment/callback  (Monetapay → Uxio)
    │
    ├─ 1. Validate:  request must contain { data: string }
    │
    ├─ 2. Decrypt:   MonetapayService::decryptPayload()
    │                AES-128-CBC · PKCS7 · base64 envelope
    │
    ├─ 3. Verify:    MonetapayService::verifyCallbackSignature()
    │                Reconstructs strMap from decrypted fields (excl. sign, timestamp)
    │                expectedSign = MD5(MD5(token + "*|*" + strMap + "@!@" + timestamp))
    │                Compared with hash_equals() — timing-safe
    │                → HTTP 400 on mismatch (Monetapay interprets 400 as failed delivery)
    │
    └─ 4. Execute:   HandleMonetapayCallbackAction
```

### `verifyCallbackSignature()` — Algorithm Detail

The Double MD5 signature algorithm is identical between outbound requests and inbound callback verification:

```
1. Extract all payload fields except { sign, timestamp }
2. ksort() — alphabetical ordering (mirrors TreeMap from createTransaction)
3. Join as:  key=value__key=value__...key=value
4. Build:    originalString = TOKEN + "*|*" + strMap + "@!@" + timestamp
5. Sign:     md5(md5(originalString))
6. Compare:  hash_equals(expectedSign, receivedSign)  ← timing-safe comparison
```

### Fraud & Idempotency Guards in `HandleMonetapayCallbackAction`

| Guard | Mechanism |
|---|---|
| Idempotency | Skip if `transaction.status` already in `[PAID, PROCESSING, COMPLETED]` |
| Amount fraud | Exact integer match: `payment.gross_amount !== dto.amount` → reject + log |
| Concurrency | `lockForUpdate()` on the Payment row inside `DB::transaction()` |

---

## 4. Asynchronous Digiflazz Fulfillment (Phase 3)

### Why Async
Monetapay's webhook expects a fast HTTP response (typically within 5 seconds). Making a synchronous HTTP call to Digiflazz inside the callback handler would risk a Monetapay timeout and a spurious retry loop. The job queue decouples the two entirely.

### Dispatch Chain

```
HandleMonetapayCallbackAction (inside DB::transaction)
    └─ On SUCCESS:
       Transaction.status = 'PAID'
       ProcessDigiflazzTopup::dispatch($transaction)   ← queued, returns immediately
           │
           │  [Queue Worker picks up job]
           │
           ├─ Transaction.status = 'PROCESSING'
           ├─ ProcessDigiflazzTransactionAction::execute($transaction)
           │       └─ DigiflazzService::createTransaction(sku, customerNo, invoiceNo)
           │              └─ MD5 signature: md5(username + key + refId)
           │
           └─ Transaction.status set based on Digiflazz sync response:
                  'Sukses'  → COMPLETED
                  'Gagal'   → FAILED_PROVIDER
                  'Pending' → PROCESSING  (Digiflazz webhook finalizes later)
```

### Job Resilience Configuration

```php
public int $tries   = 3;
public int $backoff = 30; // seconds
```

On infrastructure failure (network error, no active supplier), the exception is **re-thrown** after marking `FAILED_PROVIDER`, allowing Laravel Queue to honour the retry policy. Digiflazz-level failures (`'Gagal'`) are resolved synchronously inside the action and do not trigger a retry.

### Digiflazz Webhook (Async Finalization)

When Digiflazz responds asynchronously with a `Pending` result, it later pushes a webhook:

```
POST /v1/digiflazz/callback  (Digiflazz → Uxio)
    │
    ├─ HMAC-SHA1 verification (X-Hub-Signature header)
    │       key = config('services.digiflazz.webhook_secret')
    │       → HTTP 403 on mismatch
    │
    ├─ Ping event guard  (hook_id present → 200 OK, no action)
    │
    └─ HandleDigiflazzWebhookAction
            ├─ lockForUpdate() on Transaction
            ├─ Idempotency: skip if already COMPLETED or FAILED_PROVIDER
            ├─ Update: supplier_trx_id, sn, supplier_status, status
            ├─ Auto-refund: if FAILED_PROVIDER + payment was '3' (Success)
            │       └─ user.balance += payment.gross_amount
            │          payment.status = '4' (Refunded)
            ├─ Activity log
            └─ Discord embed notification (colour-coded by status)
```

### Unified Status Constants

All actions, jobs, and webhook handlers now share a single status vocabulary:

| Constant | Meaning |
|---|---|
| `PENDING` | Transaction created, payment not yet confirmed |
| `PAID` | Monetapay confirmed payment success |
| `PROCESSING` | Digiflazz job in-flight or response is Pending |
| `COMPLETED` | Digiflazz confirmed delivery (`Sukses`) |
| `FAILED_PROVIDER` | Digiflazz reported failure (`Gagal`) |

---

## 5. Complete End-to-End Flow

```
Client
  │
  POST /v1/checkout
  │
  CheckoutController  →  CheckoutAction (DB::transaction)
       │
       ├─ Resolve: User (nullable), Product, PaymentChannel
       ├─ Price: role-based (vip/reseller/agent/member/guest)
       ├─ Margin guard: abort if margin < 0
       ├─ Create: Transaction (PENDING) + Payment ('1': Pending)
       │
       ├─[balance]──────────────────────────────────────────────┐
       │   Deduct balance                                        │
       │   Payment → '3' (Success)                              │
       │   ProcessDigiflazzTransactionAction [sync]             │
       │   → Transaction: COMPLETED / PROCESSING / FAILED       │
       │                                                         │
       └─[external]──────────────────────────────────────────┐  │
           MonetapayService::createTransaction()             │  │
           → Returns { qr_string } or { virtual_account }   │  │
                                                             ▼  ▼
                                                        Response to Client
                                                        { invoice_number,
                                                          payment_type,
                                                          action_data }

  [User pays via QRIS / VA]
       │
  POST /v1/payment/callback  (Monetapay)
       │
       MonetapayCallbackController
         Decrypt → Verify Signature → HandleMonetapayCallbackAction
           Idempotency + Fraud checks
           Payment → '3' or '2'
           Transaction → PAID or FAILED_PROVIDER
           ProcessDigiflazzTopup::dispatch()  [async]
                │
           [Queue Worker]
                │
           Transaction → PROCESSING
           DigiflazzService::createTransaction()
           Transaction → COMPLETED / PROCESSING / FAILED_PROVIDER
                │
           [If PROCESSING]
                │
  POST /v1/digiflazz/callback  (Digiflazz)
       │
       WebhookDigiflazzController (HMAC validated)
         HandleDigiflazzWebhookAction
           Transaction → COMPLETED / FAILED_PROVIDER
           Auto-refund if FAILED_PROVIDER
           Discord notification
```

---

## 6. Transaction Status State Machine

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
   [Checkout]  →  PENDING                                      │
                    │                                          │
        ┌───────────┴─────────────┐                           │
        │ balance pay             │ external pay               │
        ▼                         ▼                           │
   [Digiflazz sync]          [Monetapay webhook]              │
        │                         │                           │
        │                       PAID                          │
        │                         │                           │
        │                   [Job dispatched]                  │
        │                         │                           │
        │                    PROCESSING ─────────────────────►│
        │                         │                           │ (Digiflazz webhook)
        ▼                         ▼                           │
   COMPLETED ◄────────────── COMPLETED                        │
   FAILED_PROVIDER ◄────── FAILED_PROVIDER ◄──────────────────┘
   PROCESSING
```

---

## 7. Modified & Created Files

### Phase 1 — Cryptography Standardization

| Action | File |
|---|---|
| **Modified** | `app/Services/Payment/MonetapayService.php` |

**Changes:**
- Replaced `"0"`-char padding loop with `str_pad($value, 16, "\0")` + `substr` in new `deriveAesParam()`
- Removed pre-computed `$aesKey` / `$aesIv` instance properties
- Added `decryptPayload(string): array` — AES-128-CBC decrypt + JSON decode
- Added `verifyCallbackSignature(array): bool` — Double MD5 verification with `hash_equals`

---

### Phase 2 — Webhook Security & Payment Routing

| Action | File |
|---|---|
| **Modified** | `app/Http/Controllers/Api/Payment/MonetapayCallbackController.php` |
| **Modified** | `app/Actions/Checkout/CheckoutAction.php` |

**Changes:**
- `MonetapayCallbackController`: Moved to constructor injection; added `verifyCallbackSignature()` gate between decrypt and DTO mapping; extended HTTP 400 condition to cover signature failures
- `CheckoutAction`: Removed stale 8-line double-assignment comment block on `$adminFee`

---

### Phase 3 — Digiflazz Async Fulfillment

| Action | File |
|---|---|
| **Modified** | `app/Actions/Digiflazz/ProcessDigiflazzTransactionAction.php` |
| **Modified** | `app/Jobs/ProcessDigiflazzTopup.php` |
| **Modified** | `app/Actions/Digiflazz/HandleDigiflazzWebhookAction.php` |
| **Modified** | `app/Http/Controllers/Api/Digiflazz/WebhookDigiflazzController.php` |
| **Modified** | `routes/api.php` |

**Changes:**
- `ProcessDigiflazzTransactionAction`: `App\Models\Order` → `App\Models\Transaction`; `mapInternalStatus` aligned to `COMPLETED` / `FAILED_PROVIDER` / `PROCESSING`
- `ProcessDigiflazzTopup`: Removed unconditional `COMPLETED` override; added `$tries = 3` / `$backoff = 30`; re-throws on exception to enable queue retries
- `HandleDigiflazzWebhookAction`: `Order` → `Transaction` everywhere including `sendToDiscord`; idempotency guard and `mapInternalStatus` aligned to uppercase constants; auto-refund guard adds `user_id` null-check
- `WebhookDigiflazzController` (Digiflazz/): Fixed namespace from `App\Http\Controllers\Api` to `App\Http\Controllers\Api\Digiflazz`
- `routes/api.php`: Import updated to `App\Http\Controllers\Api\Digiflazz\WebhookDigiflazzController`

---

*Generated by Claude Code — Uxio Integration Refactor, Phases 1–3*

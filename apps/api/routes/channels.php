<?php

use App\Enums\RoleType;
use Illuminate\Support\Facades\Broadcast;

// The invoice status channel is intentionally PUBLIC: the invoice_number is the
// only credential a guest holds (checkout is guestable), so it is not declared
// here. Its payload is deliberately minimal — see TransactionStatusUpdated.

// Back-office live transactions feed. Mirrors EnsureUserIsAdmin: the caller's
// role name must equal RoleType::ADMIN (case-insensitively).
Broadcast::channel('admin.transactions', function ($user) {
    return strtolower($user->role?->name ?? '') === RoleType::ADMIN->value;
});

// A member may only ever subscribe to their own transaction stream.
Broadcast::channel('member.{userId}.transactions', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// ── Payment page ────────────────────────────────────────────────────────────
// A merchant (payment-admin) only ever sees its own payouts / bills. merchant_id
// on the withdrawal/invoice references users.id, so the check is self-ownership.
Broadcast::channel('merchant.{merchantId}.withdrawals', function ($user, $merchantId) {
    return (int) $user->id === (int) $merchantId;
});

Broadcast::channel('merchant.{merchantId}.service-invoices', function ($user, $merchantId) {
    return (int) $user->id === (int) $merchantId;
});

// The kita team's aggregate feeds — every merchant's payouts / bills. Gated to
// the payment-internal role, mirroring EnsureUserIsPaymentInternal.
Broadcast::channel('finance.withdrawals', function ($user) {
    return strtolower($user->role?->name ?? '') === RoleType::PAYMENT_INTERNAL->value;
});

Broadcast::channel('finance.service-invoices', function ($user) {
    return strtolower($user->role?->name ?? '') === RoleType::PAYMENT_INTERNAL->value;
});

// A user's own in-app notification stream (drives the navbar badge live).
Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

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

<?php

declare(strict_types=1);

namespace App\Support\Refund;

use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Models\RefundRequest;
use App\Models\Transaction;

/**
 * The one definition of "this transaction can be refunded", and its inverse
 * "this transaction has been refunded and must not be touched again".
 *
 * Three callers need the same answer and would otherwise each invent it:
 * the refund action (silently no-ops — it runs inside webhooks), the admin
 * refund endpoint (must 422 rather than claim a refund it did not make), and
 * the admin retry action (must never re-order an item the customer was already
 * paid back for).
 */
final class RefundEligibility
{
    /**
     * Why this transaction cannot be refunded, or null when it can.
     *
     * The message is customer-facing-ish: it goes to an admin in a 422.
     */
    public static function reason(Transaction $transaction): ?string
    {
        $payment = $transaction->relationLoaded('payment')
            ? $transaction->payment
            : $transaction->payment()->first();

        if (! $payment) {
            return 'Transaksi ini tidak memiliki data pembayaran.';
        }

        if ($payment->status === PaymentStatus::REFUNDED) {
            return 'Transaksi ini sudah direfund.';
        }

        if ($payment->status !== PaymentStatus::SUCCESS) {
            // Never paid (PENDING) or the window lapsed (EXPIRED) — there is no
            // money of the customer's to give back.
            return 'Pembayaran belum berhasil, tidak ada dana yang bisa dikembalikan.';
        }

        if (self::hasOpenOrSettledRefund($transaction)) {
            return 'Refund untuk transaksi ini sudah pernah dibuat.';
        }

        return null;
    }

    public static function isRefundable(Transaction $transaction): bool
    {
        return self::reason($transaction) === null;
    }

    /**
     * True when a refund exists that is either still being worked or already
     * paid out. A REJECTED refund is deliberately excluded — the money never
     * left, so the order is fair game again.
     */
    public static function hasOpenOrSettledRefund(Transaction $transaction): bool
    {
        return RefundRequest::query()
            ->where('transaction_id', $transaction->getKey())
            ->where('status', '!=', RefundStatus::REJECTED->value)
            ->exists();
    }
}

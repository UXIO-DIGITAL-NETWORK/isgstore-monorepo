<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Support\Payment\PaymentExpiry;
use App\Support\Storefront\MediaUrl;

/**
 * The public receipt behind /invoice/{invoice_number}, polled every 5s by the
 * storefront until the status is terminal.
 *
 * The projection is built field-by-field on purpose. This endpoint is
 * unauthenticated — anyone holding the invoice number can read it — so it must
 * never carry `guest_contact`, `margin`, supplier ids, or cost prices. Invoice
 * numbers include six random characters and are therefore not enumerable, but
 * that is a second line of defence, not the first.
 */
class ShowInvoiceAction
{
    /** Statuses after which the client can stop polling. */
    public const TERMINAL_STATUSES = [
        TransactionStatus::COMPLETED,
        TransactionStatus::FAILED_PROVIDER,
        TransactionStatus::REFUNDED,
        TransactionStatus::EXPIRED,
    ];

    public function execute(string $invoiceNumber): ?array
    {
        $transaction = Transaction::query()
            ->where('invoice_number', $invoiceNumber)
            ->with([
                'product:id,category_id,name',
                'product.category:id,name,slug,code,region,logo,thumbnail',
                'paymentChannel:id,name,channel_code,payment_type',
                'payment:id,transaction_id,payment_channel_id,reference_id,gross_amount,admin_fee,payment_data,status,paid_at,created_at',
                'payment.paymentChannel:id,payment_type',
            ])
            ->first();

        if (! $transaction) {
            return null;
        }

        $payment = $transaction->payment;
        $game = $transaction->product?->category;
        $expiresAt = $payment ? PaymentExpiry::for($payment) : null;

        return [
            'invoice_number' => $transaction->invoice_number,
            'status' => $transaction->status?->value,
            'is_terminal' => in_array($transaction->status, self::TERMINAL_STATUSES, true),

            'game' => $game ? [
                'name' => $game->name,
                'slug' => $game->slug ?: $game->code,
                'region' => $game->region,
                'logo_url' => MediaUrl::for($game->logo),
                'thumbnail_url' => MediaUrl::for($game->thumbnail),
            ] : null,

            'product' => [
                'name' => $transaction->product?->name,
            ],

            'target' => [
                'uid' => $transaction->target_uid,
                'server' => $transaction->target_server,
                'nickname' => $transaction->target_nickname,
            ],

            'amount' => [
                'base' => (int) $transaction->amount_base,
                'fee' => (int) $transaction->amount_fee,
                'total' => (int) $transaction->amount_total,
            ],

            'payment' => [
                'channel' => $transaction->paymentChannel?->name,
                'channel_code' => $transaction->paymentChannel?->channel_code,
                'type' => $transaction->paymentChannel?->payment_type,
                'reference_id' => $payment?->reference_id,
                'status' => $payment?->status?->value,
                'paid_at' => $payment?->paid_at?->toIso8601String(),
                // Persisted at checkout so a refresh still renders the QR / VA.
                'instructions' => $payment?->payment_data ?: null,
            ],

            // Drives the countdown. Null when the channel has no configured
            // window — the client then hides the timer rather than inventing one.
            'expires_at' => $expiresAt?->toIso8601String(),

            // Voucher / serial number, present once Digiflazz has fulfilled.
            'sn' => $transaction->sn,
            'created_at' => $transaction->created_at?->toIso8601String(),
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Models\PaymentChannel;
use App\Models\User;
use App\Support\Pricing\AdminFeeSetting;

/**
 * Payment channels the caller can actually complete a purchase with, plus the
 * global admin-fee markup so the storefront can show the same total the backend
 * will charge (channel fee + admin markup) before checkout.
 *
 * `balance` is member-only — CheckoutAction rejects it for guests — so offering
 * it to an anonymous visitor would be a dead end. It is filtered here rather
 * than in the client so the rule lives with the rule it mirrors.
 */
class ListPaymentChannelsAction
{
    private const MEMBER_ONLY_CHANNELS = ['balance'];

    /** @return array{admin_fee: array{type: string, value: int}, channels: list<array<string, mixed>>} */
    public function execute(?User $user): array
    {
        $query = PaymentChannel::query()
            ->where('is_active', true)
            // Only the three offered categories (VA / e-wallet / QRIS) reach the
            // storefront. `balance` is a member wallet, not one of those types,
            // so members get it back through the union below.
            ->where(function ($q) use ($user) {
                $q->whereIn('payment_type', PaymentChannel::ALLOWED_STOREFRONT_PAYMENT_TYPES);

                if ($user) {
                    $q->orWhereIn('channel_code', self::MEMBER_ONLY_CHANNELS);
                }
            });

        if (! $user) {
            $query->whereNotIn('channel_code', self::MEMBER_ONLY_CHANNELS);
        }

        $channels = $query
            ->orderBy('payment_type')
            // by id, not name — keeps seeder order so the "[SIT]" test channels
            // sort last instead of first.
            ->orderBy('id')
            ->get(['id', 'name', 'channel_code', 'payment_type', 'fee_flat', 'fee_percent', 'min_amount'])
            ->map(fn (PaymentChannel $channel) => [
                'id' => $channel->id,
                'name' => $channel->name,
                'channel_code' => $channel->channel_code,
                'payment_type' => $channel->payment_type,
                'fee_flat' => (int) $channel->fee_flat,
                'fee_percent' => (float) $channel->fee_percent,
                'min_amount' => (int) $channel->min_amount,
                // Only meaningful for `balance`; lets the client render the
                // customer's spendable amount without a second request.
                'balance' => $channel->channel_code === 'balance' ? (int) ($user?->balance ?? 0) : null,
            ])
            ->values()
            ->all();

        return [
            'admin_fee' => AdminFeeSetting::current(),
            'channels' => $channels,
        ];
    }
}

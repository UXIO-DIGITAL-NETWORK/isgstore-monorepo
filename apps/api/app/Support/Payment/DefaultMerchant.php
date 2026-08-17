<?php

declare(strict_types=1);

namespace App\Support\Payment;

use App\Enums\RoleType;
use App\Models\Setting;
use App\Models\User;

/**
 * The single "client" merchant every otherwise-unowned sale is attributed to.
 *
 * The payment page settles each sale to the merchant that owns the product, but
 * nothing sets `products.merchant_id` — the whole top-up catalogue is one
 * client's. So a checkout with no product owner falls back to this default
 * merchant, which is what makes the transaction visible in the payment-page
 * feeds and dashboards at all.
 *
 * Resolution: an explicit `payment.default_merchant_id` setting if configured,
 * otherwise the first payment-admin user (there is exactly one). Resolved fresh
 * on each call — a single indexed lookup, and never memoised so it cannot carry
 * a stale id across a `RefreshDatabase` test boundary.
 */
final class DefaultMerchant
{
    public static function id(): ?int
    {
        $fromSetting = Setting::query()
            ->where('group', 'payment')
            ->where('key', 'default_merchant_id')
            ->first()?->typedValue();

        if ($fromSetting !== null && (int) $fromSetting > 0) {
            return (int) $fromSetting;
        }

        $id = User::whereHas('role', fn ($q) => $q->whereRaw('LOWER(name) = ?', [RoleType::PAYMENT_ADMIN->value]))
            ->orderBy('id')
            ->value('id');

        return $id ? (int) $id : null;
    }
}

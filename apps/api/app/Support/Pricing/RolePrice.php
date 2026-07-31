<?php

declare(strict_types=1);

namespace App\Support\Pricing;

use App\Models\Product;
use App\Models\User;

/**
 * Which of a product's five price columns a given customer pays.
 *
 * Extracted from CheckoutAction so the catalog can quote the same number the
 * invoice will charge. If these two ever disagree the customer sees one price
 * and is billed another — so there is exactly one implementation.
 *
 * Guests fall through to `price_member`, which is the pre-existing behaviour.
 */
final class RolePrice
{
    public static function for(Product $product, ?User $user): int
    {
        return match (self::roleName($user)) {
            'vip' => (int) $product->price_vip,
            'reseller' => (int) $product->price_reseller,
            'agent' => (int) $product->price_agent,
            default => (int) $product->price_member,
        };
    }

    private static function roleName(?User $user): string
    {
        if (! $user) {
            return 'guest';
        }

        // relationLoaded guard: the catalog resolves the user from a bearer
        // token without eager-loading, and a lazy load per product row would
        // turn one listing into N queries.
        $role = $user->relationLoaded('role') ? $user->getRelation('role') : $user->role;

        return strtolower((string) ($role?->name ?? 'guest'));
    }
}

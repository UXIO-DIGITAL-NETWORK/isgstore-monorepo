<?php

declare(strict_types=1);

namespace App\Support\Activity;

use Illuminate\Support\Str;

/**
 * Derives a display category for an activity log so the admin Activity page's
 * "Type" column is meaningful even for the many rows written without an explicit
 * type. A stored type always wins; otherwise the message (and transaction link)
 * is classified heuristically — this is a label only, not business logic.
 */
final class ActivityTypeClassifier
{
    public static function classify(?string $storedType, ?int $transactionId, string $message): ?string
    {
        if ($storedType !== null && $storedType !== '') {
            return $storedType;
        }

        if (self::has($message, ['logged in', 'logged out', 'log in', 'access token', 'refreshed', 'with Google', 'registered'])) {
            return 'login';
        }

        // Note: no bare "Uxiotopup"/supplier names here — those collide with admin
        // data changes ("Deleted Supplier: Uxiotopup"). Uxiotopup webhook logs carry
        // an INV- reference, so they still classify as transactions.
        if ($transactionId !== null
            || self::has($message, ['INV-', 'SINV-', 'Checkout', 'checkout', 'Transaction', 'pembayaran', 'isi saldo', 'refund', 'Refund', 'callback', 'receipt', 'Rating', 'Point history', 'spending'])) {
            return 'transaction';
        }

        if (self::has($message, ['Created', 'Updated', 'Deleted', 'Set profit', 'Set status', 'Locked', 'Unlocked', 'Memetakan', 'Menandai', 'announcement', 'banner', 'article', 'FAQ', 'testimonial', 'pricing rule', 'Supplier', 'Category', 'Product', 'user'])) {
            return 'data';
        }

        if (self::has($message, ['Password', 'Profile', 'timezone', 'status'])) {
            return 'security';
        }

        return null;
    }

    /** Case-insensitive "contains any". */
    private static function has(string $haystack, array $needles): bool
    {
        return Str::contains($haystack, $needles, ignoreCase: true);
    }
}

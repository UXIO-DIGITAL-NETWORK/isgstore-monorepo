<?php

declare(strict_types=1);

namespace App\Support\Refund;

use App\Models\RefundRequest;
use Illuminate\Support\Str;

/**
 * The single definition of the guest refund claim credential.
 *
 * The plaintext token travels once, in the customer's email (and WhatsApp, once
 * delivery is switched on), and is never stored: only its sha256 lands in
 * `refund_requests.claim_token_hash`.
 * A leaked database dump therefore cannot redirect anyone's refund, and the
 * lookup by hash stays a single indexed read.
 *
 * The token also expires. A refund link that still works a year later is a
 * bearer credential sitting in an old inbox with nothing to revoke it.
 */
final class RefundClaimToken
{
    /** Long enough that guessing is not a strategy; short enough for a URL. */
    private const LENGTH = 48;

    /** How long the customer has to fill in their payout details. */
    public const TTL_DAYS = 30;

    /** @return array{0: string, 1: string} [plaintext, hash] */
    public static function generate(): array
    {
        $plain = Str::random(self::LENGTH);

        return [$plain, self::hash($plain)];
    }

    public static function hash(string $plain): string
    {
        return hash('sha256', $plain);
    }

    /**
     * Resolve a plaintext token to its refund, or null when it is unknown or
     * expired. Callers must treat both cases identically — telling them apart
     * would confirm that a guessed token once existed.
     */
    public static function resolve(string $plain): ?RefundRequest
    {
        if (trim($plain) === '') {
            return null;
        }

        $refund = RefundRequest::where('claim_token_hash', self::hash($plain))->first();

        if (! $refund) {
            return null;
        }

        if ($refund->claim_expires_at !== null && $refund->claim_expires_at->isPast()) {
            return null;
        }

        return $refund;
    }
}

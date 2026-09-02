<?php

declare(strict_types=1);

namespace App\Support\Refund;

use App\Models\RefundRequest;
use App\Models\User;
use App\Support\Phone;

/**
 * "Is this account allowed to receive this refund?"
 *
 * The claim token is the primary credential — this is the second lock. A link
 * forwarded to someone else (or read out of an inbox) still cannot redirect the
 * money, because the account taking it must carry the same email or phone the
 * order was placed with.
 *
 * It is deliberately not the *only* lock: registration has no email
 * verification (`MustVerifyEmail` is commented out on the User model), so
 * "my email matches the order" is an unverified self-assertion. Matched against
 * a token it is defence in depth; matched against an invoice number alone it
 * would be no defence at all. Never call this without a resolved token.
 *
 * Phone spellings come from `Phone::candidates()` rather than a second set of
 * 08/62/+62 rules — the refund lookup and "Cek Pesanan" already share it, and
 * a drifting third copy would lock customers out of their own money.
 */
final class RefundContactMatcher
{
    /** Which contact matched, or null when neither did. */
    public static function match(RefundRequest $refund, User $user): ?RefundContactMatch
    {
        $email = self::normalizeEmail($user->email);
        $refundEmail = self::normalizeEmail($refund->contact_email);

        if ($email !== null && $refundEmail !== null && $email === $refundEmail) {
            return new RefundContactMatch('email', (string) $user->email);
        }

        $phone = trim((string) $user->phone);
        $refundPhone = trim((string) $refund->contact_phone);

        if ($phone !== '' && $refundPhone !== '') {
            // Compare spelling-for-spelling in both directions: either side may
            // be the one stored as "0812…" and the other as "+62812…".
            $candidates = Phone::candidates($phone);

            if ($candidates !== [] && in_array($refundPhone, $candidates, true)) {
                return new RefundContactMatch('phone', $phone);
            }

            $refundCandidates = Phone::candidates($refundPhone);

            if ($refundCandidates !== [] && in_array($phone, $refundCandidates, true)) {
                return new RefundContactMatch('phone', $phone);
            }
        }

        return null;
    }

    private static function normalizeEmail(?string $email): ?string
    {
        $email = strtolower(trim((string) $email));

        return $email === '' ? null : $email;
    }
}

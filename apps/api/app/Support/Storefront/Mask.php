<?php

declare(strict_types=1);

namespace App\Support\Storefront;

/**
 * Partial redaction for values rendered on public pages.
 *
 * Reviews and the leaderboard show who made a purchase, which means other
 * customers' names and game ids appear on an unauthenticated page. Masking
 * keeps them recognisable to their owner without publishing them.
 */
final class Mask
{
    /** "Ramonezz" → "Ram•••zz"; short names keep only their first character. */
    public static function name(?string $name): string
    {
        $name = trim((string) $name);

        if ($name === '') {
            return 'Anonim';
        }

        $length = mb_strlen($name);

        if ($length <= 3) {
            return mb_substr($name, 0, 1).str_repeat('•', max(1, $length - 1));
        }

        $head = mb_substr($name, 0, 3);
        $tail = mb_substr($name, -2);

        return $head.str_repeat('•', max(2, $length - 5)).$tail;
    }

    /** "337850017" → "3378•••17" — enough to recognise your own order, not enough to reuse. */
    public static function gameId(?string $id): ?string
    {
        $id = trim((string) $id);

        if ($id === '') {
            return null;
        }

        $length = mb_strlen($id);

        if ($length <= 4) {
            return str_repeat('•', $length);
        }

        return mb_substr($id, 0, 4).str_repeat('•', max(2, $length - 6)).mb_substr($id, -2);
    }
}

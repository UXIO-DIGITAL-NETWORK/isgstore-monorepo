<?php

declare(strict_types=1);

namespace App\Support\Auth;

/**
 * RFC 4648 base32, the alphabet every authenticator app speaks.
 *
 * Written by hand rather than pulled in, matching `App\Support\Phone` and
 * `App\Support\Refund\RefundClaimToken`: it is a frozen spec in forty lines,
 * and the encoding of a TOTP secret is not somewhere to inherit a surprise.
 *
 * `decode()` is deliberately forgiving about how the secret comes back: a user
 * who types it into their authenticator by hand will introduce spaces, and some
 * apps lowercase it. Padding is optional because Google Authenticator omits it.
 */
final class Base32
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function encode(string $bytes): string
    {
        if ($bytes === '') {
            return '';
        }

        $bits = '';
        foreach (str_split($bytes) as $byte) {
            $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }

        $output = '';
        foreach (str_split($bits, 5) as $chunk) {
            $output .= self::ALPHABET[bindec(str_pad($chunk, 5, '0', STR_PAD_RIGHT))];
        }

        // Padding deliberately omitted — authenticator apps do not want it.
        return $output;
    }

    /** @return string Raw bytes, or '' when the input is not valid base32. */
    public static function decode(string $encoded): string
    {
        // Tolerate what a human retypes: spaces, lowercase, and '=' padding.
        $encoded = strtoupper(preg_replace('/[\s=]/', '', $encoded) ?? '');

        if ($encoded === '' || strspn($encoded, self::ALPHABET) !== strlen($encoded)) {
            return '';
        }

        $bits = '';
        foreach (str_split($encoded) as $char) {
            $bits .= str_pad(decbin((int) strpos(self::ALPHABET, $char)), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        // Trailing bits that do not complete a byte are padding, not data.
        foreach (str_split(substr($bits, 0, intdiv(strlen($bits), 8) * 8), 8) as $chunk) {
            $bytes .= chr(bindec($chunk));
        }

        return $bytes;
    }

    /** A fresh secret. 20 bytes is the RFC 4226 recommendation for HMAC-SHA1. */
    public static function randomSecret(int $bytes = 20): string
    {
        return self::encode(random_bytes($bytes));
    }
}

<?php

declare(strict_types=1);

namespace App\Support\Auth;

/**
 * RFC 6238 time-based one-time passwords — what Google Authenticator generates.
 *
 * Hand-written against a frozen spec, like `Phone` and `RefundClaimToken`. The
 * two places implementations go wrong are the base32 decoder (see `Base32`) and
 * comparing codes with `===`, which leaks timing; `hash_equals` on the digit
 * strings covers the second.
 *
 * `verify()` returns the **timestep** a code matched at rather than a boolean,
 * because the caller has to persist it. A ±1 window means one code stays valid
 * for about ninety seconds, and the realistic attack on TOTP is a phishing
 * proxy relaying a code the victim just typed — recording the last accepted
 * step is what stops the same code being spent twice.
 */
final class Totp
{
    public const DIGITS = 6;

    public const PERIOD = 30;

    /** One step either side, for clocks that drift. */
    private const WINDOW = 1;

    public static function at(string $secret, int $timestep): string
    {
        $key = Base32::decode($secret);

        if ($key === '') {
            return '';
        }

        // The counter is a 64-bit big-endian integer.
        $binary = pack('J', $timestep);
        $hash = hash_hmac('sha1', $binary, $key, true);

        // Dynamic truncation, RFC 4226 §5.4.
        $offset = ord($hash[19]) & 0x0F;
        $value = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        return str_pad((string) ($value % (10 ** self::DIGITS)), self::DIGITS, '0', STR_PAD_LEFT);
    }

    public static function timestep(?int $at = null): int
    {
        return intdiv($at ?? time(), self::PERIOD);
    }

    /**
     * @param  int|null  $after  Reject any step at or below this — the last one
     *                           this account already spent a code on.
     * @return int|null The matching timestep, or null when nothing matched.
     */
    public static function verify(string $secret, string $code, ?int $after = null, ?int $at = null): ?int
    {
        $code = preg_replace('/\D/', '', $code) ?? '';

        if (strlen($code) !== self::DIGITS) {
            return null;
        }

        $current = self::timestep($at);

        for ($offset = -self::WINDOW; $offset <= self::WINDOW; $offset++) {
            $step = $current + $offset;

            if ($after !== null && $step <= $after) {
                continue;
            }

            if (hash_equals(self::at($secret, $step), $code)) {
                return $step;
            }
        }

        return null;
    }

    /** The `otpauth://` URI an authenticator app scans. */
    public static function provisioningUri(string $secret, string $account, string $issuer): string
    {
        return 'otpauth://totp/'.rawurlencode($issuer.':'.$account).'?'.http_build_query([
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => 'SHA1',
            'digits' => self::DIGITS,
            'period' => self::PERIOD,
        ]);
    }
}

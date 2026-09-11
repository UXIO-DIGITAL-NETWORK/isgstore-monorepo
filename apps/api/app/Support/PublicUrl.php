<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Whether a base URL is fit to put in front of a customer.
 *
 * This exists because of a refund claim link that went out over WhatsApp
 * reading `http://localhost:5173/id/refund?token=…`. Every layer reported
 * success — the message sent, `claim_notified_at` was stamped, the refund row
 * looked handled — and the person owed the money had no way to claim it. The
 * cause was a config default: `STOREFRONT_URL` fell back to a developer's dev
 * server, so a deployment that never set the variable shipped that address to
 * real buyers rather than failing.
 *
 * **A missing value is now missing, not a localhost.** The defaults are gone
 * from `config/services.php`, and every outbound link is built through here, so
 * an unreachable base stops the send instead of producing a dead link.
 *
 * What counts as unreachable is deliberately about *the customer's* network,
 * not ours: loopback, RFC 1918 private ranges, the mDNS/dev TLDs, and the
 * IANA-reserved example domains. Plain `http` on a real domain is **not**
 * refused — a site behind a proxy that terminates TLS elsewhere is a real
 * deployment, and guessing otherwise would break it for no safety gain.
 */
final class PublicUrl
{
    /** Hostnames and TLDs that only resolve on the machine that built them. */
    private const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

    private const LOCAL_SUFFIXES = ['.localhost', '.local', '.test', '.invalid', '.internal'];

    /** Reserved by IANA for documentation — a placeholder someone forgot to replace. */
    private const PLACEHOLDER_SUFFIXES = ['example.com', 'example.net', 'example.org'];

    public static function isPublic(?string $url): bool
    {
        if ($url === null || trim($url) === '') {
            return false;
        }

        $host = parse_url(trim($url), PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return false;
        }

        // parse_url keeps the brackets on an IPv6 literal.
        $host = strtolower(trim($host, '[]'));

        if (in_array($host, self::LOCAL_HOSTS, true)) {
            return false;
        }

        foreach (array_merge(self::LOCAL_SUFFIXES, self::PLACEHOLDER_SUFFIXES) as $suffix) {
            if ($host === ltrim($suffix, '.') || str_ends_with($host, $suffix)) {
                return false;
            }
        }

        // A private address is reachable from our network and nobody else's,
        // which is exactly the failure this guards.
        if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
            return filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
        }

        return true;
    }

    /**
     * The configured base URL with its trailing slash removed, or null when it
     * is not something a customer could open.
     *
     * Callers treat null as "do not send a link", never as "send this anyway".
     */
    public static function base(string $configKey): ?string
    {
        $url = config($configKey);

        if (! is_string($url) || ! self::isPublic($url)) {
            return null;
        }

        return rtrim(trim($url), '/');
    }

    /** The consumer storefront, where every customer-facing link lives. */
    public static function storefront(): ?string
    {
        return self::base('services.storefront.url');
    }

    /** Uxiolabs Pay, where a client renews their own site's subscription. */
    public static function paymentPage(): ?string
    {
        return self::base('services.payment_page.url');
    }
}

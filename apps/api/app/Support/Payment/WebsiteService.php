<?php

declare(strict_types=1);

namespace App\Support\Payment;

use App\Models\Service;
use App\Models\Setting;

/**
 * Which catalogue service *is* this website.
 *
 * Nothing on `services` marks one row as "the site you are looking at" — the
 * catalogue is kita's list of everything it sells to clients (the topup site,
 * the payment gateway, a domain, a WhatsApp API), and `category` is free-form.
 * So the answer is a setting rather than a hardcoded code, and a deployment
 * that sells its website under a different code only has to change a row.
 *
 * Resolved fresh on every call and never memoised — the same reasoning as
 * `DefaultMerchant`: a cached id survives a `RefreshDatabase` boundary and
 * turns one test's service into another's.
 */
final class WebsiteService
{
    private const DEFAULT_CODE = 'uxiolabs';

    /**
     * The setting this site's licence code arrives in.
     *
     * The Hub creates a licence PER SITE — named and priced for that client — so
     * the code is not something this deployment can know in advance. The plan
     * sync writes it here when it sees the line the Hub marked as the licence.
     */
    public const LICENCE_CODE_KEY = 'licence_service_code';

    public static function code(): string
    {
        // The Hub's own answer first; then the deployment's configured website
        // service, where a site registered before licences were per-site still
        // keeps its own; then the built-in default.
        return self::setting('payment', self::LICENCE_CODE_KEY)
            ?? self::setting('payment', 'website_service_code')
            ?? self::DEFAULT_CODE;
    }

    public static function get(): ?Service
    {
        return Service::query()->where('code', self::code())->first();
    }

    /**
     * What to CALL this site's own subscription on this site's own screens.
     *
     * Not `services.name`. That row belongs to the Hub — it is "Uxiolabs" there,
     * because that is what kita sells — and `hub:sync-catalog` rewrites it every
     * minute, so renaming it locally lasts until the next tick. But the
     * client's admin panel and payment page are the client's own product, and a
     * card in their sidebar reading someone else's brand is confusing at best.
     *
     * So the label is resolved from this site's own identity instead, with an
     * explicit override first for the deployment that wants to say something
     * else entirely.
     */
    public static function label(): string
    {
        $override = self::setting('payment', 'website_service_label');

        if ($override !== null) {
            return $override;
        }

        return self::setting('general', 'site_name')
            ?? (string) config('services.storefront.brand', 'Langganan website');
    }

    /** A non-blank string setting, or null. */
    private static function setting(string $group, string $key): ?string
    {
        $value = Setting::query()
            ->where('group', $group)
            ->where('key', $key)
            ->first()?->typedValue();

        $value = is_string($value) ? trim($value) : '';

        return $value !== '' ? $value : null;
    }
}

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

    public static function code(): string
    {
        $configured = Setting::query()
            ->where('group', 'payment')
            ->where('key', 'website_service_code')
            ->first()?->typedValue();

        $code = is_string($configured) ? trim($configured) : '';

        return $code !== '' ? $code : self::DEFAULT_CODE;
    }

    public static function get(): ?Service
    {
        return Service::query()->where('code', self::code())->first();
    }
}

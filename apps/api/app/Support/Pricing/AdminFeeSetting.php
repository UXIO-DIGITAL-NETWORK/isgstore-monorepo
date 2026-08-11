<?php

declare(strict_types=1);

namespace App\Support\Pricing;

use App\Models\Setting;

/**
 * The global admin-fee markup that "kita" (payment-internal) adds on top of the
 * per-channel fee. Stored in the `settings` table (group `payment`) as
 * `admin_fee_type` (percent|fixed) + `admin_fee_value`. A missing setting means
 * no markup, so checkout is unchanged until the internal team configures one.
 */
final class AdminFeeSetting
{
    public const GROUP = 'payment';

    public const KEY_TYPE = 'admin_fee_type';

    public const KEY_VALUE = 'admin_fee_value';

    public const TYPE_PERCENT = 'percent';

    public const TYPE_FIXED = 'fixed';

    /** @return array{type: string, value: int} */
    public static function current(): array
    {
        $rows = Setting::whereIn('key', [self::KEY_TYPE, self::KEY_VALUE])->pluck('value', 'key');

        $type = $rows[self::KEY_TYPE] ?? self::TYPE_FIXED;
        $value = (int) round((float) ($rows[self::KEY_VALUE] ?? 0));

        return [
            'type' => in_array($type, [self::TYPE_PERCENT, self::TYPE_FIXED], true) ? $type : self::TYPE_FIXED,
            'value' => max(0, $value),
        ];
    }

    /** The markup in rupiah for a given (already discounted) selling price. */
    public static function compute(int $sellingPrice): int
    {
        $setting = self::current();

        return $setting['type'] === self::TYPE_PERCENT
            ? (int) round($sellingPrice * ($setting['value'] / 100))
            : $setting['value'];
    }

    public static function save(string $type, int $value): void
    {
        Setting::updateOrCreate(
            ['key' => self::KEY_TYPE],
            ['group' => self::GROUP, 'value' => $type, 'type' => 'string', 'label' => 'Tipe biaya admin']
        );
        Setting::updateOrCreate(
            ['key' => self::KEY_VALUE],
            ['group' => self::GROUP, 'value' => (string) $value, 'type' => 'number', 'label' => 'Nilai biaya admin']
        );
    }
}

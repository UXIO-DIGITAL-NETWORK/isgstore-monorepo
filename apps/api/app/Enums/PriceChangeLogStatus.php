<?php

namespace App\Enums;

enum PriceChangeLogStatus: string
{
    /** Selling prices were recomputed and applied automatically. */
    case APPLIED = 'applied';

    /** Cost moved but the product's price is locked, so it was left frozen. */
    case LOCKED = 'locked';

    /** The SKU went inactive at the provider — the product can't be sold until handled. */
    case DEACTIVATED = 'deactivated';

    /** After markup and clamping, the member price is still below cost. */
    case NEGATIVE_MARGIN = 'negative_margin';

    /**
     * Rows the admin has to act on, as opposed to a routine applied reprice.
     *
     * @return array<int,string>
     */
    public static function needsAttention(): array
    {
        return [self::DEACTIVATED->value, self::NEGATIVE_MARGIN->value];
    }
}

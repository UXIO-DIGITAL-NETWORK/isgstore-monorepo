<?php

namespace App\Enums;

enum PriceChangeLogStatus: string
{
    /** Selling prices were recomputed and applied automatically. */
    case APPLIED = 'applied';

    /**
     * Cost moved while the product's price was frozen by the admin.
     *
     * No longer written — nothing freezes a selling price any more — but the
     * rows already in `price_change_logs` are history and must stay readable.
     */
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

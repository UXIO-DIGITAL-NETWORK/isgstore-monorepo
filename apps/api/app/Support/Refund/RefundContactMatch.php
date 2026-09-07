<?php

declare(strict_types=1);

namespace App\Support\Refund;

/**
 * Which order contact an account matched, and what it said at that moment.
 *
 * The value is frozen onto the refund row rather than joined, because the
 * account can change its email or phone in the profile afterwards and the
 * admin verifying two days later must see what was actually matched — the same
 * reasoning that already freezes `amount` and `merchant_id` on this table.
 */
final readonly class RefundContactMatch
{
    public function __construct(
        /** @var 'email'|'phone' */
        public string $field,
        public string $value,
    ) {}
}

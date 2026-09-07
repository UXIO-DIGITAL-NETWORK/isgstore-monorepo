<?php

declare(strict_types=1);

namespace App\DTOs\Withdrawal;

/**
 * The decrypted Monetapay payout (7.4.2) callback. `outNo` is our
 * withdrawal_number (sent as mch_order_no); `status` is Monetapay's payout
 * state — "0" Processing / "1" Successful / "2" Failed.
 */
readonly class DisbursementCallbackDTO
{
    public function __construct(
        public string $outNo,
        public string $status,
        public array $rawPayload,
    ) {}
}

<?php

namespace App\Traits;

use App\Enums\TransactionStatus;

trait MapsUxiolabsStatus
{
    /**
     * Map a uxiolabs status string to our internal Transaction status.
     *
     * uxiolabs statuses: pending | processing | success | cancel | refund
     * (callbacks may also carry "paid"). Anything non-terminal (and any
     * unrecognised value) maps to PROCESSING; the callback later finalises it
     * to COMPLETED or FAILED_PROVIDER.
     */
    protected function mapUxiolabsStatus(string $uxiolabsStatus): TransactionStatus
    {
        return match (strtolower($uxiolabsStatus)) {
            'success' => TransactionStatus::COMPLETED,
            'cancel', 'refund' => TransactionStatus::FAILED_PROVIDER,
            default => TransactionStatus::PROCESSING,
        };
    }
}

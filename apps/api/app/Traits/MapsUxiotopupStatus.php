<?php

namespace App\Traits;

use App\Enums\TransactionStatus;

trait MapsUxiotopupStatus
{
    /**
     * Map a uxiotopup status string to our internal Transaction status.
     *
     * uxiotopup statuses: pending | processing | success | cancel | refund
     * (callbacks may also carry "paid"). Anything non-terminal (and any
     * unrecognised value) maps to PROCESSING; the callback later finalises it
     * to COMPLETED or FAILED_PROVIDER.
     */
    protected function mapUxiotopupStatus(string $uxiotopupStatus): TransactionStatus
    {
        return match (strtolower($uxiotopupStatus)) {
            'success' => TransactionStatus::COMPLETED,
            'cancel', 'refund' => TransactionStatus::FAILED_PROVIDER,
            default => TransactionStatus::PROCESSING,
        };
    }
}

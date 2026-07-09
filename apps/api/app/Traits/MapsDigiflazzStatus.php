<?php

namespace App\Traits;

use App\Enums\TransactionStatus;

trait MapsDigiflazzStatus
{
    /**
     * Map a Digiflazz status string to our internal Transaction status.
     *
     * Digiflazz "Pending" (and any unrecognised value) maps to PROCESSING; the
     * status webhook later finalises it to COMPLETED or FAILED_PROVIDER.
     */
    protected function mapDigiflazzStatus(string $digiflazzStatus): TransactionStatus
    {
        return match (strtolower($digiflazzStatus)) {
            'sukses' => TransactionStatus::COMPLETED,
            'gagal' => TransactionStatus::FAILED_PROVIDER,
            default => TransactionStatus::PROCESSING,
        };
    }
}

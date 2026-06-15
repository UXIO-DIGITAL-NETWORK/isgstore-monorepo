<?php

namespace App\Traits;

trait MapsDigiflazzStatus
{
    /**
     * Map a Digiflazz status string to our internal Transaction status constant.
     *
     * Digiflazz "Pending" (and any unrecognised value) maps to PROCESSING; the
     * status webhook later finalises it to COMPLETED or FAILED_PROVIDER.
     */
    protected function mapDigiflazzStatus(string $digiflazzStatus): string
    {
        return match (strtolower($digiflazzStatus)) {
            'sukses' => 'COMPLETED',
            'gagal' => 'FAILED_PROVIDER',
            default => 'PROCESSING',
        };
    }
}

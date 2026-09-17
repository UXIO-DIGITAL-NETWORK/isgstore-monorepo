<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\CheckUxiolabsPricesAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;

class UxiolabsSyncController extends Controller
{
    use ApiResponse;

    public function sync(CheckUxiolabsPricesAction $action)
    {
        try {
            $report = $action->execute();

            // Another run held the lock, so nothing was done. 409 rather than a
            // 200 that reports all zeroes — a caller reading the counts would
            // otherwise conclude the catalogue was clean.
            if ($report->skippedReason !== null) {
                return $this->errorResponse($report->skippedReason, 409, $report->toArray());
            }

            return $this->successResponse(
                $report->toArray(),
                "Cek harga selesai: {$report->totalFetched} layanan Uxiotopup, {$report->priceChangedCount} perubahan modal"
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}

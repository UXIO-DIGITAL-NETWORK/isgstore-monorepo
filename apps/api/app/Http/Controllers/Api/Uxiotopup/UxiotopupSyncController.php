<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\CheckUxiotopupPricesAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;

class UxiotopupSyncController extends Controller
{
    use ApiResponse;

    public function sync(CheckUxiotopupPricesAction $action)
    {
        try {
            $report = $action->execute();

            return $this->successResponse(
                $report->toArray(),
                "Cek harga selesai: {$report->totalFetched} layanan uxiotopup, {$report->priceChangedCount} perubahan modal"
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}

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

            return $this->successResponse(
                $report->toArray(),
                "Cek harga selesai: {$report->totalFetched} layanan uxiolabs, {$report->priceChangedCount} perubahan modal"
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}

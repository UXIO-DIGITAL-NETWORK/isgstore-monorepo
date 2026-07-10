<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\GenerateProductImportTemplateAction;
use App\Actions\Digiflazz\ImportDigiflazzProductsAction;
use App\Exceptions\DigiflazzProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\ImportDigiflazzProductsRequest;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzProductImportController extends Controller
{
    use ApiResponse;

    /**
     * Binary xlsx download — intentional deviation from the ApiResponse
     * envelope (documented in CLAUDE.md).
     */
    public function template(GenerateProductImportTemplateAction $action)
    {
        return response($action->execute(), 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="template-import-produk-digiflazz.xlsx"',
        ]);
    }

    public function import(ImportDigiflazzProductsRequest $request, ImportDigiflazzProductsAction $action)
    {
        try {
            $report = $action->execute(
                $request->file('file')->getRealPath(),
                $request->string('type')->toString()
            );
        } catch (DigiflazzProductException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (Exception $e) {
            return $this->errorResponse('Import gagal: '.$e->getMessage(), 502);
        }

        return $this->successResponse(
            $report->toArray(),
            "Import selesai: {$report->created} produk dibuat, {$report->failed} baris gagal"
        );
    }
}

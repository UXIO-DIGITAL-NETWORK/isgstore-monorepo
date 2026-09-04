<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\GenerateProductImportTemplateAction;
use App\Actions\Uxiolabs\ImportUxiolabsProductsAction;
use App\Exceptions\UxiolabsProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiolabs\ImportUxiolabsProductsRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiolabsProductImportController extends Controller
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
            'Content-Disposition' => 'attachment; filename="template-import-produk-uxiolabs.xlsx"',
        ]);
    }

    public function import(ImportUxiolabsProductsRequest $request, ImportUxiolabsProductsAction $action)
    {
        try {
            $report = $action->execute($request->file('file')->getRealPath());
        } catch (UxiolabsProductException $e) {
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

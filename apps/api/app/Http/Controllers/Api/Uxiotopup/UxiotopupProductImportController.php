<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\GenerateProductImportTemplateAction;
use App\Actions\Uxiotopup\ImportUxiotopupProductsAction;
use App\Exceptions\UxiotopupProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiotopup\ImportUxiotopupProductsRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiotopupProductImportController extends Controller
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
            'Content-Disposition' => 'attachment; filename="template-import-produk-uxiotopup.xlsx"',
        ]);
    }

    public function import(ImportUxiotopupProductsRequest $request, ImportUxiotopupProductsAction $action)
    {
        try {
            $report = $action->execute($request->file('file')->getRealPath());
        } catch (UxiotopupProductException $e) {
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

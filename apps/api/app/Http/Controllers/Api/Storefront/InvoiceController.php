<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\ShowInvoiceAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class InvoiceController extends Controller
{
    use ApiResponse;

    public function __invoke(string $invoiceNumber, ShowInvoiceAction $action): JsonResponse
    {
        $invoice = $action->execute($invoiceNumber);

        if (! $invoice) {
            return $this->errorResponse('Invoice tidak ditemukan.', 404);
        }

        return $this->successResponse($invoice, 'Invoice retrieved successfully');
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Invoice\GenerateInvoicePdfAction;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Public invoice PDF download (same audience as GET /v1/invoices/{invoiceNumber}
 * — anyone holding the random, non-enumerable invoice number). Binary/stream
 * response, an intentional deviation from the ApiResponse envelope.
 */
class InvoiceDownloadController extends Controller
{
    public function __invoke(string $invoiceNumber, Request $request, GenerateInvoicePdfAction $action): StreamedResponse
    {
        $transaction = Transaction::where('invoice_number', $invoiceNumber)->firstOrFail();

        $requested = (string) $request->query('locale');
        $locale = in_array($requested, ['id', 'en'], true) ? $requested : ($transaction->locale ?? 'id');

        $pdf = $action->execute($transaction, $locale);

        return response()->streamDownload(
            fn () => print ($pdf),
            "Invoice-{$invoiceNumber}.pdf",
            ['Content-Type' => 'application/pdf'],
        );
    }
}

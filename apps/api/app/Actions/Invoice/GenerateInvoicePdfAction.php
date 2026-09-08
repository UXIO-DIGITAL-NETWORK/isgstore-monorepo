<?php

namespace App\Actions\Invoice;

use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * The single source of truth for the invoice PDF: renders the transaction into
 * a PDF that mirrors the receipt email's visual language. Used by both the
 * public download endpoint and the receipt email's attachment, so the file the
 * buyer downloads is identical to the one attached to their email.
 */
class GenerateInvoicePdfAction
{
    public function execute(Transaction $transaction, string $locale = 'id'): string
    {
        $locale = in_array($locale, ['id', 'en'], true) ? $locale : 'id';

        $t = $transaction->loadMissing(['product.category', 'paymentChannel']);
        $target = trim(($t->target_uid ?? '').($t->target_server ? ' ('.$t->target_server.')' : ''));

        $data = [
            'brand' => (string) config('services.storefront.brand', 'ISG Store'),
            'statusText' => $t->status instanceof \BackedEnum ? $t->status->value : (string) $t->status,
            'invoice' => $t->invoice_number,
            'gameName' => $t->product?->category?->name,
            'productName' => $t->product?->name,
            'target' => $target !== '' ? $target : null,
            'serial' => $t->sn,
            'paymentName' => $t->paymentChannel?->name,
            'subtotal' => (int) $t->amount_base,
            'fee' => (int) $t->amount_fee,
            'adminFee' => (int) $t->channel_fee,
            'discount' => (int) $t->discount_amount,
            'total' => (int) $t->amount_total,
        ];

        // Render inside the buyer's locale so the labels/date resolve correctly,
        // then restore whatever the caller was using.
        $previous = app()->getLocale();
        app()->setLocale($locale);

        try {
            $data['date'] = optional($t->created_at)->translatedFormat('d M Y, H:i');

            return Pdf::loadView('pdf.invoice', $data)->output();
        } finally {
            app()->setLocale($previous);
        }
    }
}

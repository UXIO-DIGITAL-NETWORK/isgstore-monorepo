<?php

namespace Tests\Feature;

use App\Actions\Invoice\GenerateInvoicePdfAction;
use App\Mail\TransactionReceiptMail;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceDownloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_download_returns_a_pdf_without_authentication(): void
    {
        $transaction = Transaction::factory()->create([
            'invoice_number' => 'INV-DL-1',
            'amount_base' => 25000,
            'amount_total' => 26000,
        ]);

        $response = $this->get("/api/v1/invoices/{$transaction->invoice_number}/download");

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
        $this->assertStringStartsWith('%PDF', $response->streamedContent());
    }

    public function test_download_returns_404_for_an_unknown_invoice(): void
    {
        $this->get('/api/v1/invoices/INV-NOPE/download')->assertNotFound();
    }

    public function test_generate_action_produces_a_pdf(): void
    {
        $transaction = Transaction::factory()->create(['invoice_number' => 'INV-DL-2', 'amount_total' => 10000]);

        $pdf = app(GenerateInvoicePdfAction::class)->execute($transaction, 'id');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_pdf_template_renders_in_both_locales(): void
    {
        $data = [
            'brand' => 'TOPUP GAME',
            'statusText' => 'COMPLETED',
            'invoice' => 'INV-DL-3',
            'date' => '09 Aug 2026, 10:00',
            'gameName' => 'Mobile Legends',
            'productName' => '5 Diamond',
            'target' => '63193868 (2027)',
            'serial' => null,
            'paymentName' => 'QRIS',
            'subtotal' => 1650,
            'fee' => 0,
            'discount' => 0,
            'total' => 1650,
        ];

        app()->setLocale('id');
        $id = view('pdf.invoice', $data)->render();
        $this->assertStringContainsString('Bukti Pembelian', $id);
        $this->assertStringContainsString('Total Dibayar', $id);
        $this->assertStringContainsString('Rp 1.650', $id);

        app()->setLocale('en');
        $en = view('pdf.invoice', $data)->render();
        $this->assertStringContainsString('Purchase Receipt', $en);
        $this->assertStringContainsString('Total Paid', $en);
    }

    public function test_receipt_email_attaches_the_invoice_pdf(): void
    {
        $transaction = Transaction::factory()->create(['invoice_number' => 'INV-DL-4', 'amount_total' => 5000]);

        $attachments = (new TransactionReceiptMail($transaction, 'id'))->attachments();

        $this->assertCount(1, $attachments);
    }
}

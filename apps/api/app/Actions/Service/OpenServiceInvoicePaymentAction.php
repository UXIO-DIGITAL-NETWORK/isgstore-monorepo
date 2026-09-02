<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ServiceInvoiceStatus;
use App\Models\PaymentChannel;
use App\Models\ServiceInvoice;
use App\Models\ServiceInvoicePayment;
use App\Services\Payment\MonetapayService;
use App\Support\Money;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Opens a Monetapay payment for a service bill.
 *
 * The single place that talks to the gateway on behalf of a service invoice.
 * The invoice itself is **not** marked paid here — that happens only when the
 * gateway confirms, in `HandleMonetapayCallbackAction`. Activating a
 * subscription at this point would hand out a service for an unpaid bill.
 *
 * Modelled on `CreateBalanceTopupAction`, the other payable that shares the
 * checkout gateway without owning a `transactions` row. The reference carries
 * an `SRV-` prefix so the shared callback can route to a service bill without
 * a database lookup.
 */
class OpenServiceInvoicePaymentAction
{
    /** Callers must match this against `HandleMonetapayCallbackAction`. */
    public const REFERENCE_PREFIX = 'SRV-';

    public function __construct(
        private readonly MonetapayService $monetapayService,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    public function execute(ServiceInvoice $invoice, int $paymentChannelId): ServiceInvoicePayment
    {
        // Same duplicate-submit guard as checkout: a double-tap must not open
        // two payments for one bill.
        $dedupeKey = 'service-invoice:pay:'.md5("{$invoice->id}|{$paymentChannelId}");

        if (! Cache::add($dedupeKey, 1, 15)) {
            throw new RuntimeException('Permintaan duplikat terdeteksi. Mohon tunggu beberapa detik sebelum mencoba lagi.');
        }

        try {
            return $this->process($invoice, $paymentChannelId);
        } catch (Throwable $e) {
            Cache::forget($dedupeKey);
            throw $e;
        }
    }

    private function process(ServiceInvoice $invoice, int $paymentChannelId): ServiceInvoicePayment
    {
        if ($invoice->status !== ServiceInvoiceStatus::UNPAID) {
            throw new RuntimeException('Invoice ini tidak dapat dibayar lagi.');
        }

        if ($invoice->due_at !== null && $invoice->due_at->isPast()) {
            throw new RuntimeException('Invoice ini sudah melewati jatuh tempo.');
        }

        $channel = PaymentChannel::where('is_active', true)->find($paymentChannelId);

        if (! $channel) {
            throw new RuntimeException('Metode pembayaran tidak tersedia.');
        }

        // The merchant's settlement balance is not a way to pay its own bills:
        // that would move money between two ledgers this action does not model.
        if (! in_array($channel->payment_type, PaymentChannel::ALLOWED_STOREFRONT_PAYMENT_TYPES, true)) {
            throw new RuntimeException('Metode pembayaran ini tidak dapat dipakai untuk tagihan service.');
        }

        // Same fee arithmetic as a storefront top-up, so a client is charged
        // the way every other payer on this platform is.
        $amount = (int) $invoice->amount;
        $feePercent = max(0, min(100, (float) $channel->fee_percent));
        $adminFee = (int) $channel->fee_flat + (int) round($amount * ($feePercent / 100));
        $total = $amount + $adminFee;

        if ($total < (int) $channel->min_amount) {
            throw new RuntimeException(
                'Total pembayaran '.Money::rupiah($total).
                ' kurang dari minimum '.Money::rupiah((int) $channel->min_amount)
            );
        }

        $referenceId = self::REFERENCE_PREFIX.date('Ymd').'-'.strtoupper(Str::random(8));

        $attempt = DB::transaction(function () use ($invoice, $channel, $amount, $adminFee, $total, $referenceId) {
            // At most one live attempt per invoice: an abandoned QR must not
            // stay payable once the client has asked for a different method.
            ServiceInvoicePayment::where('service_invoice_id', $invoice->id)
                ->where('status', 'PENDING')
                ->update(['status' => 'EXPIRED']);

            return ServiceInvoicePayment::create([
                'service_invoice_id' => $invoice->id,
                'payment_channel_id' => $channel->id,
                'reference_id' => $referenceId,
                'amount' => $amount,
                'admin_fee' => $adminFee,
                'total' => $total,
                'status' => 'PENDING',
            ]);
        });

        $merchant = $invoice->merchant;

        try {
            $response = $this->monetapayService->createTransaction(
                referenceId: $referenceId,
                amount: $total,
                paymentType: $channel->payment_type,
                channelCode: $channel->channel_code,
                customerData: [
                    'customer_name' => $merchant?->name,
                    'customer_email' => $merchant?->email,
                    'customer_phone' => $merchant?->phone,
                    'is_single_use' => $channel->is_single_use ? '1' : '0',
                    'product_id' => 'SERVICE',
                    'product_name' => $invoice->service_name,
                    'product_price' => (string) $amount,
                    'product_category' => 'Service',
                ]
            );
        } catch (Throwable $e) {
            // Close the attempt rather than leaving a PENDING row with no QR
            // and no VA — it would block the next attempt and the expiry sweep
            // would later ask the gateway about a reference it never issued.
            $attempt->update(['status' => 'EXPIRED']);

            throw new RuntimeException('Gagal membuka pembayaran: '.$e->getMessage(), previous: $e);
        }

        $pgData = $response['data'] ?? [];

        // `redirect_url` and `deeplink_url` are included on purpose: they are
        // the *only* output of createTransaction's e-wallet branch, and the
        // storefront's equivalent filter drops them — an e-wallet payment
        // there has nothing to open.
        $instructions = array_filter([
            'order_no' => $pgData['order_no'] ?? null,
            'qr_string' => $pgData['qr_string'] ?? null,
            'virtual_account' => $pgData['virtual_account'] ?? null,
            'bank_code' => $pgData['bank_code'] ?? null,
            'redirect_url' => $pgData['redirect_url'] ?? null,
            'deeplink_url' => $pgData['deeplink_url'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        $attempt->update([
            'pg_transaction_id' => $pgData['order_no'] ?? null,
            // Persisted so a page refresh still shows the QR or VA number.
            'payment_data' => $instructions ?: null,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $invoice->merchant_id,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Membuka pembayaran {$invoice->invoice_number} Rp {$total} via {$channel->name}",
        ));

        return $attempt->fresh(['paymentChannel']);
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ServiceInvoiceStatus;
use App\Models\PaymentChannel;
use App\Models\ServiceInvoice;
use App\Models\ServiceInvoicePayment;
use App\Models\ServiceInvoicePaymentItem;
use App\Services\Payment\MonetapayService;
use App\Support\Money;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Opens a Monetapay payment for one or several service bills.
 *
 * The single place that talks to the gateway on behalf of a service invoice.
 * No invoice is marked paid here — that happens only when the gateway confirms,
 * in `HandleMonetapayCallbackAction`. Activating a subscription at this point
 * would hand out a service for an unpaid bill.
 *
 * ONE ATTEMPT MAY COVER SEVERAL BILLS. A client with four things falling due on
 * the same day pays once. The bills stay one-per-service — that is what keeps
 * each period's own term honest — and the payment is the thing that spans them.
 * `service_invoice_payment_items` records which, and for how much each.
 *
 * The batch path and the single path are the same code on purpose: the fee
 * arithmetic, the duplicate guard, the `createTransaction` call and the
 * instruction filter exist exactly once, as the repo-wide rule about money
 * numbers requires.
 */
class OpenServiceInvoicePaymentAction
{
    /** Callers must match this against `HandleMonetapayCallbackAction`. */
    public const REFERENCE_PREFIX = 'SRV-';

    /** More than this in one attempt is a script, not a client paying bills. */
    public const MAX_INVOICES = 20;

    public function __construct(
        private readonly MonetapayService $monetapayService,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    public function execute(ServiceInvoice $invoice, int $paymentChannelId): ServiceInvoicePayment
    {
        return $this->executeBatch(collect([$invoice]), $paymentChannelId);
    }

    /** @param Collection<int, ServiceInvoice> $invoices */
    public function executeBatch(Collection $invoices, int $paymentChannelId): ServiceInvoicePayment
    {
        $invoices = $invoices->unique('id')->sortBy('id')->values();

        if ($invoices->isEmpty()) {
            throw new RuntimeException('Pilih minimal satu tagihan.');
        }

        if ($invoices->count() > self::MAX_INVOICES) {
            throw new RuntimeException('Terlalu banyak tagihan dalam satu pembayaran.');
        }

        // Same duplicate-submit guard as checkout, keyed on the whole set: a
        // double-tap must not open two payments for the same bills.
        $dedupeKey = 'service-invoice:pay:'.md5($invoices->pluck('id')->implode(',')."|{$paymentChannelId}");

        if (! Cache::add($dedupeKey, 1, 15)) {
            throw new RuntimeException('Permintaan duplikat terdeteksi. Mohon tunggu beberapa detik sebelum mencoba lagi.');
        }

        try {
            return $this->process($invoices, $paymentChannelId);
        } catch (Throwable $e) {
            Cache::forget($dedupeKey);
            throw $e;
        }
    }

    /** @param Collection<int, ServiceInvoice> $invoices */
    private function process(Collection $invoices, int $paymentChannelId): ServiceInvoicePayment
    {
        foreach ($invoices as $invoice) {
            if ($invoice->status !== ServiceInvoiceStatus::UNPAID) {
                throw new RuntimeException("Invoice {$invoice->invoice_number} tidak dapat dibayar lagi.");
            }

            // A due date is a DATE, not an instant: a bill due on the 20th is
            // payable all through the 20th. Comparing the raw timestamp made
            // every bill "past due" from midnight of its own due date — and for
            // a bill the Hub anchors the moment it is created, whose period
            // begins immediately, that meant it could never be paid at all.
            //
            // And it only lapses for a bill a CLIENT raised. That one may safely
            // be refused: the request was abandoned, and they can ask again. A
            // HUB-plan bill must never be — the client owes it, the site stays
            // dark until it is paid, and there is no second way to raise it:
            // the period's `hub_item_key` is unique and the expiry sweep skips
            // `hub_plan` precisely so the row survives. Refusing the payment
            // therefore strands the bill AND the service behind it, with nothing
            // anywhere able to re-open either.
            if ($invoice->due_at !== null
                && ! $invoice->isFromHubPlan()
                && $invoice->due_at->copy()->endOfDay()->isPast()) {
                throw new RuntimeException("Invoice {$invoice->invoice_number} sudah melewati jatuh tempo.");
            }
        }

        // One payer per attempt. Without this a caller could bundle two clients'
        // bills into one payment and settle both against one person's money.
        if ($invoices->pluck('merchant_id')->unique()->count() > 1) {
            throw new RuntimeException('Tagihan dari klien berbeda tidak bisa dibayar sekaligus.');
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

        // Same fee arithmetic as a storefront top-up, so a client is charged the
        // way every other payer on this platform is — and charged ONCE. Applying
        // `fee_flat` per invoice would be a plain overcharge on every batch.
        $amount = (int) $invoices->sum('amount');
        $feePercent = max(0, min(100, (float) $channel->fee_percent));
        $adminFee = (int) $channel->fee_flat + (int) round($amount * ($feePercent / 100));
        $total = $amount + $adminFee;

        if ($total < (int) $channel->min_amount) {
            throw new RuntimeException(
                'Total pembayaran '.Money::rupiah($total).
                ' kurang dari minimum '.Money::rupiah((int) $channel->min_amount)
            );
        }

        $shares = $this->apportionFee($invoices, $amount, $adminFee);

        $referenceId = self::REFERENCE_PREFIX.date('Ymd').'-'.strtoupper(Str::random(8));

        $attempt = DB::transaction(function () use ($invoices, $channel, $amount, $adminFee, $total, $referenceId, $shares) {
            // At most one live attempt per bill. This must reach every attempt
            // that covers ANY of these bills, batch or not: two live payables
            // for one invoice means a client can pay for it twice, and there is
            // no refund path for a service invoice anywhere in this app.
            $liveAttemptIds = ServiceInvoicePaymentItem::query()
                ->whereIn('service_invoice_id', $invoices->pluck('id'))
                ->pluck('service_invoice_payment_id');

            ServiceInvoicePayment::whereIn('id', $liveAttemptIds)
                ->where('status', 'PENDING')
                ->update(['status' => 'EXPIRED']);

            $attempt = ServiceInvoicePayment::create([
                // Populated only for a single-invoice attempt, as a convenience
                // for reading history. The pivot below is the authority.
                'service_invoice_id' => $invoices->count() === 1 ? $invoices->first()->id : null,
                'invoice_count' => $invoices->count(),
                'payment_channel_id' => $channel->id,
                'reference_id' => $referenceId,
                'amount' => $amount,
                'admin_fee' => $adminFee,
                'total' => $total,
                'status' => 'PENDING',
            ]);

            foreach ($invoices as $invoice) {
                ServiceInvoicePaymentItem::create([
                    'service_invoice_payment_id' => $attempt->id,
                    'service_invoice_id' => $invoice->id,
                    'amount' => (int) $invoice->amount,
                    'admin_fee' => $shares[$invoice->id],
                ]);
            }

            return $attempt;
        });

        $merchant = $invoices->first()->merchant;
        $label = $invoices->count() === 1
            ? (string) $invoices->first()->service_name
            : $invoices->count().' tagihan layanan';

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
                    'product_name' => $label,
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
            userId: (int) $invoices->first()->merchant_id,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: 'Membuka pembayaran '.$invoices->pluck('invoice_number')->implode(', ')." Rp {$total} via {$channel->name}",
        ));

        return $attempt->fresh(['paymentChannel']);
    }

    /**
     * Split the ONE channel fee across the bills it covers.
     *
     * Proportional to each bill, with the rounding remainder pushed onto the
     * first row so the shares sum to exactly what was charged. A rupiah that
     * exists on the attempt but on none of its items — or the reverse — is the
     * kind of gap nobody finds until somebody balances the books, so the result
     * is asserted rather than trusted.
     *
     * @param  Collection<int, ServiceInvoice>  $invoices
     * @return array<int, int>
     */
    private function apportionFee(Collection $invoices, int $amount, int $adminFee): array
    {
        $shares = [];
        $assigned = 0;

        foreach ($invoices as $index => $invoice) {
            if ($index === 0) {
                $shares[$invoice->id] = 0; // filled in last, with the remainder

                continue;
            }

            $share = $amount > 0 ? intdiv($adminFee * (int) $invoice->amount, $amount) : 0;
            $shares[$invoice->id] = $share;
            $assigned += $share;
        }

        $shares[$invoices->first()->id] = $adminFee - $assigned;

        if (array_sum($shares) !== $adminFee) {
            throw new RuntimeException('Pembagian biaya admin tidak seimbang.');
        }

        return $shares;
    }
}

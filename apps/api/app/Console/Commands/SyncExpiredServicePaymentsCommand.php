<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Service\ActivateServiceSubscriptionAction;
use App\Enums\ServiceInvoiceStatus;
use App\Models\ServiceInvoice;
use App\Models\ServiceInvoicePayment;
use App\Services\Payment\MonetapayService;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Closes stale service-bill payments, and recovers the ones that were actually
 * paid.
 *
 * The sibling `payments:sync-expired` cannot cover these: it joins through
 * `whereHas('transaction')`, and a service payment owns no `transactions` row.
 *
 * The recovery half is the point. A client who pays a QR whose webhook never
 * arrives would otherwise sit with an unpaid bill and no subscription, having
 * genuinely paid — so the gateway is asked what really happened before any
 * attempt is written off.
 */
class SyncExpiredServicePaymentsCommand extends Command
{
    protected $signature = 'service-payments:sync-expired
        {--dry-run : Show what would be updated without writing to the database}';

    protected $description = 'Query Monetapay for stale PENDING service invoice payments and sync their real status.';

    /** Monetapay status strings that indicate the client successfully paid. */
    private const SUCCESS_STATUSES = ['1', '3', 'success', 'paid', 'settlement'];

    /** Monetapay status strings that mean "still in-flight — come back later". */
    private const PENDING_STATUSES = ['pending', 'processing', 'waiting', '0', ''];

    public function __construct(
        private readonly MonetapayService $monetapay,
        private readonly ActivateServiceSubscriptionAction $activateAction,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        if ($dry) {
            $this->info('[DRY RUN] No database writes will occur.');
        }

        $attempts = ServiceInvoicePayment::with(['paymentChannel', 'invoice'])
            ->where('status', 'PENDING')
            ->get()
            // Shared window definition — see App\Support\Payment\PaymentExpiry.
            // Reused rather than re-derived so the countdown a client sees can
            // never disagree with the sweep that closes the attempt.
            ->filter(fn (ServiceInvoicePayment $attempt) => $attempt->isExpired());

        if ($attempts->isEmpty()) {
            $this->info('No stale pending service payments found.');

            return self::SUCCESS;
        }

        $this->info("Found {$attempts->count()} stale service payment(s). Syncing with Monetapay...");

        $counts = ['expired' => 0, 'paid' => 0, 'skipped' => 0, 'errors' => 0];

        foreach ($attempts as $attempt) {
            $counts[$this->sync($attempt, $dry)]++;
        }

        $this->table(
            ['Outcome', 'Count'],
            collect($counts)->map(fn ($v, $k) => [ucfirst($k), $v])->values()->toArray()
        );

        return self::SUCCESS;
    }

    private function sync(ServiceInvoicePayment $attempt, bool $dry): string
    {
        $ref = $attempt->reference_id;
        $type = $attempt->paymentChannel->payment_type ?? 'unknown';

        try {
            $params = ['mch_order_no' => $ref];
            $response = match ($type) {
                'virtual_account' => $this->monetapay->inquiryVirtualAccount($params),
                'qris' => $this->monetapay->inquiryQris($params),
                'ewallet' => $this->monetapay->inquiryEwallet($params),
                default => null,
            };

            if (! $response) {
                $this->warn("  SKIP  {$ref} — payment type '{$type}' has no inquiry endpoint.");

                return 'skipped';
            }

            if (($response['code'] ?? -1) !== 0) {
                $msg = $response['message'] ?? 'unknown error';
                $this->warn("  SKIP  {$ref} — Monetapay inquiry failed: {$msg}");
                Log::warning('service-payments:sync-expired inquiry failed', [
                    'reference_id' => $ref,
                    'response' => $response,
                ]);

                return 'skipped';
            }

            $mpStatus = strtolower($response['data']['status'] ?? '');

            if (in_array($mpStatus, self::PENDING_STATUSES, true)) {
                $this->line("  WAIT  {$ref} — Monetapay reports still pending (status: '{$mpStatus}').");

                return 'skipped';
            }

            $isSuccess = in_array($mpStatus, self::SUCCESS_STATUSES, true);

            $this->line(sprintf(
                '  %s  %s (Monetapay status: \'%s\')',
                $isSuccess ? 'PAID (recovered)' : 'EXPIRED',
                $ref,
                $mpStatus,
            ));

            if ($dry) {
                return $isSuccess ? 'paid' : 'expired';
            }

            $this->apply($attempt, $isSuccess);

            Log::info('service-payments:sync-expired updated', [
                'reference_id' => $ref,
                'outcome' => $isSuccess ? 'paid' : 'expired',
                'mp_status' => $mpStatus,
            ]);

            return $isSuccess ? 'paid' : 'expired';
        } catch (Exception $e) {
            $this->error("  ERROR {$ref} — {$e->getMessage()}");
            Log::error('service-payments:sync-expired exception', [
                'reference_id' => $ref,
                'error' => $e->getMessage(),
            ]);

            return 'errors';
        }
    }

    /**
     * Writes the verdict under a lock, with the same guards the webhook uses —
     * this command and a late callback can land on the same attempt.
     */
    private function apply(ServiceInvoicePayment $attempt, bool $isSuccess): void
    {
        DB::transaction(function () use ($attempt, $isSuccess) {
            $locked = ServiceInvoicePayment::lockForUpdate()->find($attempt->id);

            if (! $locked || $locked->status !== 'PENDING') {
                return; // already handled by the webhook or another run
            }

            if (! $isSuccess) {
                $locked->update(['status' => 'EXPIRED']);

                return;
            }

            $locked->update(['status' => 'PAID', 'paid_at' => now()]);

            // One attempt may have settled several bills. Ascending invoice id
            // so this and a late callback cannot deadlock each other.
            $invoiceIds = $locked->items()
                ->orderBy('service_invoice_id')
                ->pluck('service_invoice_id');

            foreach ($invoiceIds as $invoiceId) {
                $invoice = ServiceInvoice::whereKey($invoiceId)->lockForUpdate()->first();

                if (! $invoice || $invoice->status === ServiceInvoiceStatus::PAID) {
                    continue;
                }

                $invoice->update([
                    'status' => ServiceInvoiceStatus::PAID,
                    'verified_at' => now(),
                ]);

                $this->activateAction->execute($invoice);
            }
        });
    }
}

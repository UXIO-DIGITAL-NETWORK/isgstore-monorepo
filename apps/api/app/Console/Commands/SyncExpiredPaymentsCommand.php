<?php

namespace App\Console\Commands;

use App\Actions\Settlement\SettleMerchantTransactionAction;
use App\Contracts\PaymentGateway;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Jobs\ProcessUxiolabsTopup;
use App\Models\Payment;
use App\Support\Payment\PaymentExpiry;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncExpiredPaymentsCommand extends Command
{
    protected $signature = 'payments:sync-expired
        {--dry-run : Show what would be updated without writing to the database}';

    protected $description = 'Query Monetapay for stale PENDING payments and sync their real status into the database.';

    /** Monetapay status strings that indicate the customer successfully paid. */
    private const SUCCESS_STATUSES = ['1', '3', 'success', 'paid', 'settlement'];

    /** Monetapay status strings that mean "still in-flight — come back later". */
    private const PENDING_STATUSES = ['pending', 'processing', 'waiting', '0', ''];

    public function __construct(
        private readonly PaymentGateway $monetapay,
        private readonly SettleMerchantTransactionAction $settle,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        if ($dry) {
            $this->info('[DRY RUN] No database writes will occur.');
        }

        $payments = Payment::with(['transaction', 'paymentChannel'])
            ->where('status', PaymentStatus::PENDING->value)
            ->whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::PENDING->value))
            ->get()
            // Shared window definition — see App\Support\Payment\PaymentExpiry.
            ->filter(fn (Payment $payment) => PaymentExpiry::isExpired($payment));

        if ($payments->isEmpty()) {
            $this->info('No stale pending payments found.');

            return self::SUCCESS;
        }

        $this->info("Found {$payments->count()} stale payment(s). Syncing with Monetapay...");

        $counts = ['expired' => 0, 'paid' => 0, 'skipped' => 0, 'errors' => 0];

        foreach ($payments as $payment) {
            $outcome = $this->syncPayment($payment, $dry);
            $counts[$outcome]++;
        }

        $this->table(
            ['Outcome', 'Count'],
            collect($counts)->map(fn ($v, $k) => [ucfirst($k), $v])->values()->toArray()
        );

        return self::SUCCESS;
    }

    private function syncPayment(Payment $payment, bool $dry): string
    {
        $ref = $payment->reference_id;
        $type = $payment->paymentChannel->payment_type ?? 'unknown';

        try {
            $params = ['mch_order_no' => $ref];
            $response = match ($type) {
                'virtual_account' => $this->monetapay->inquiryVirtualAccount($params),
                'qris' => $this->monetapay->inquiryQris($params),
                'ewallet' => $this->monetapay->inquiryEwallet($params),
                'payment_link' => $this->monetapay->inquiryPaymentLink($params),
                default => null,
            };

            if (! $response) {
                $this->warn("  SKIP  {$ref} — payment type '{$type}' has no inquiry endpoint.");

                return 'skipped';
            }

            if (($response['code'] ?? -1) !== 0) {
                $msg = $response['message'] ?? 'unknown error';
                $this->warn("  SKIP  {$ref} — Monetapay inquiry failed: {$msg}");
                Log::warning('payments:sync-expired inquiry failed', [
                    'reference_id' => $ref,
                    'response' => $response,
                ]);

                return 'skipped';
            }

            $mpStatus = strtolower($response['data']['status'] ?? '');
            $isSuccess = in_array($mpStatus, self::SUCCESS_STATUSES, true);
            $isPending = in_array($mpStatus, self::PENDING_STATUSES, true);

            if ($isPending) {
                $this->line("  WAIT  {$ref} — Monetapay reports still pending (status: '{$mpStatus}').");

                return 'skipped';
            }

            $label = $isSuccess ? 'PAID (recovered)' : 'EXPIRED';
            $this->line("  {$label}  {$ref} (Monetapay status: '{$mpStatus}')");

            if ($dry) {
                return $isSuccess ? 'paid' : 'expired';
            }

            $dispatched = false;

            DB::transaction(function () use ($payment, $isSuccess, &$dispatched) {
                // Re-fetch with lock inside the transaction to prevent races
                $locked = Payment::with('transaction')
                    ->lockForUpdate()
                    ->find($payment->id);

                if (! $locked || $locked->transaction->status !== TransactionStatus::PENDING) {
                    return; // already handled by another process
                }

                $locked->update([
                    'status' => $isSuccess ? PaymentStatus::SUCCESS : PaymentStatus::EXPIRED,
                    'paid_at' => $isSuccess ? now() : null,
                ]);

                $locked->transaction->update([
                    'status' => $isSuccess ? TransactionStatus::PAID : TransactionStatus::EXPIRED,
                ]);

                $dispatched = $isSuccess;
            });

            if ($dispatched) {
                // Eager-load the payment: the split reads `gateway_fee` and
                // `tax_amount` off it, and a lazy load out here is a needless
                // query on every recovered payment.
                $transaction = $payment->transaction->fresh(['payment']);

                // The same split the webhook books, in the same order — after
                // the commit, so a payment recovered here credits the merchant
                // their `amount_base` and records kita's markup, instead of only
                // fulfilling the order. Idempotent on the invoice number, so a
                // late webhook cannot credit it a second time.
                $this->settle->execute($transaction);

                ProcessUxiolabsTopup::dispatch($transaction);
            }

            Log::info('payments:sync-expired updated', [
                'reference_id' => $ref,
                'outcome' => $isSuccess ? 'paid' : 'expired',
                'mp_status' => $mpStatus,
            ]);

            return $isSuccess ? 'paid' : 'expired';

        } catch (Exception $e) {
            $this->error("  ERROR {$ref} — {$e->getMessage()}");
            Log::error('payments:sync-expired exception', [
                'reference_id' => $ref,
                'error' => $e->getMessage(),
            ]);

            return 'errors';
        }
    }
}

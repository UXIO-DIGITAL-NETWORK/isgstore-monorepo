<?php

namespace App\Actions\Payment\Monetapay;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Payment\Monetapay\MonetapayCallbackDTO;
use App\Jobs\ProcessDigiflazzBillPayment;
use App\Jobs\ProcessDigiflazzTopup;
use App\Models\Payment;
use App\Models\Transaction;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HandleMonetapayCallbackAction
{
    public function __construct(
        private readonly CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(MonetapayCallbackDTO $dto): void
    {
        // Capture here so we can dispatch after the transaction commits.
        // Dispatching inside DB::transaction risks the worker picking up the job
        // before the Payment/Transaction rows are committed and visible.
        $paidTransaction = null;

        DB::transaction(function () use ($dto, &$paidTransaction) {

            // Lock the Payment row to prevent concurrent webhook replays
            /** @var Payment $payment */
            $payment = Payment::with('transaction')
                ->where('reference_id', $dto->outNo)
                ->lockForUpdate()
                ->firstOrFail();

            /** @var Transaction $transaction */
            $transaction = $payment->transaction;

            // ── Idempotency guard ────────────────────────────────────────────
            // Monetapay may retry webhooks; return 200 without re-processing
            if (in_array($transaction->status, ['PAID', 'PROCESSING', 'COMPLETED', 'EXPIRED', 'FAILED_PROVIDER'], true)) {
                Log::info("Monetapay callback ignored — already {$transaction->status}", [
                    'reference_id' => $dto->outNo,
                ]);

                return;
            }

            // ── Anti-fraud: exact amount verification ────────────────────────
            if ((int) $payment->gross_amount !== (int) $dto->amount) {
                $this->log(
                    $dto->outNo,
                    "FRAUD: amount mismatch. Expected {$payment->gross_amount}, received {$dto->amount}."
                );
                throw new Exception("Amount mismatch for reference {$dto->outNo}.");
            }

            // ── Determine outcome ────────────────────────────────────────────
            // Known Monetapay success signals:
            //   '1' → Paid (standard VA / redirect flow)
            //   '3' → Settled (instant methods: QRIS, E-Wallet)
            //   'success' → legacy/string variant (case-normalised before comparison)
            // Using in_array() with a strict allowlist is safer than chained equality
            // checks — any unrecognised code is treated as failure by default.
            $isSuccess = \in_array(\strtolower($dto->status), ['1', '3', 'success'], true);

            // ── Persist payment result ───────────────────────────────────────
            $payment->update([
                'status' => $isSuccess ? '3' : '2',   // 3: Success, 2: Failed/Expired
                'paid_at' => $isSuccess ? now() : null,
            ]);

            $transaction->update([
                'status' => $isSuccess ? 'PAID' : 'EXPIRED',
            ]);

            $this->log($dto->outNo, "Callback processed — Monetapay status: {$dto->status}");

            if ($isSuccess) {
                $paidTransaction = $transaction->fresh(); // ensure latest state is dispatched
            }
        });

        // ── Dispatch Digiflazz job after commit ──────────────────────────────
        // At this point DB::transaction() has returned, meaning the commit is done.
        // The queue worker will always see the PAID rows when it picks up the job.
        if ($paidTransaction) {
            if ($paidTransaction->transaction_type === 'postpaid') {
                ProcessDigiflazzBillPayment::dispatch($paidTransaction);
            } else {
                ProcessDigiflazzTopup::dispatch($paidTransaction);
            }
        }
    }

    private function log(string $referenceId, string $message): void
    {
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: null,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "{$message} | Ref: {$referenceId}",
        ));
    }
}

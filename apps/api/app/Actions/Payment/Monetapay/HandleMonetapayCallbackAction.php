<?php

namespace App\Actions\Payment\Monetapay;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Payment\Monetapay\MonetapayCallbackDTO;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Jobs\ProcessDigiflazzBillPayment;
use App\Jobs\ProcessDigiflazzTopup;
use App\Models\BalanceTopup;
use App\Models\Payment;
use App\Models\Transaction;
use App\Support\Wallet\WalletLedger;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HandleMonetapayCallbackAction
{
    /** Wallet top-up references carry this prefix; checkout uses `PAY-`. */
    private const TOPUP_REFERENCE_PREFIX = 'TOP-';

    public function __construct(
        private readonly CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(MonetapayCallbackDTO $dto): void
    {
        // Wallet top-ups share this webhook but have no Transaction or Payment
        // row — they are recognised by their reference prefix so the lookup
        // below never has to fail first.
        if (str_starts_with($dto->outNo, self::TOPUP_REFERENCE_PREFIX)) {
            $this->handleBalanceTopup($dto);

            return;
        }

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
            if (in_array($transaction->status, [
                TransactionStatus::PAID,
                TransactionStatus::PROCESSING,
                TransactionStatus::COMPLETED,
                TransactionStatus::EXPIRED,
                TransactionStatus::FAILED_PROVIDER,
            ], true)) {
                Log::channel('monetapay')->info("Monetapay callback ignored — already {$transaction->status->value}", [
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
                'status' => $isSuccess ? PaymentStatus::SUCCESS : PaymentStatus::EXPIRED,
                'paid_at' => $isSuccess ? now() : null,
            ]);

            $transaction->update([
                'status' => $isSuccess ? TransactionStatus::PAID : TransactionStatus::EXPIRED,
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

    /**
     * Credits a member's wallet once Monetapay confirms the payment.
     *
     * Mirrors the order path's guarantees exactly, because the failure modes
     * are the same and the money here is real:
     *
     *  - the row is locked for the whole read-modify-write, so two concurrent
     *    webhook deliveries cannot both credit;
     *  - a top-up already in a terminal state is ignored, so a retried webhook
     *    credits once, not twice;
     *  - the paid amount must match the invoice exactly, so a tampered
     *    callback cannot credit more than was charged;
     *  - the balance moves only through WalletLedger, so every movement leaves
     *    an auditable before/after record.
     */
    private function handleBalanceTopup(MonetapayCallbackDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            /** @var BalanceTopup|null $topup */
            $topup = BalanceTopup::where('reference_id', $dto->outNo)->lockForUpdate()->first();

            if (! $topup) {
                Log::channel('monetapay')->warning('Monetapay callback for an unknown top-up reference', [
                    'reference_id' => $dto->outNo,
                ]);

                throw new Exception("No balance top-up found for reference {$dto->outNo}.");
            }

            if ($topup->status !== 'PENDING') {
                Log::channel('monetapay')->info("Top-up callback ignored — already {$topup->status}", [
                    'reference_id' => $dto->outNo,
                ]);

                return;
            }

            if ((int) $topup->total !== (int) $dto->amount) {
                $this->log(
                    $dto->outNo,
                    "FRAUD: top-up amount mismatch. Expected {$topup->total}, received {$dto->amount}."
                );

                throw new Exception("Amount mismatch for top-up {$dto->outNo}.");
            }

            $isSuccess = \in_array(\strtolower($dto->status), ['1', '3', 'success'], true);

            if (! $isSuccess) {
                $topup->update(['status' => 'EXPIRED']);
                $this->log($dto->outNo, "Top-up failed — Monetapay status: {$dto->status}");

                return;
            }

            $topup->update(['status' => 'PAID', 'paid_at' => now()]);

            // Credits `amount`, not `total`: the admin fee is the gateway's,
            // not the customer's to spend.
            WalletLedger::record(
                user: $topup->user_id,
                amount: (int) $topup->amount,
                type: 'topup',
                reference: $topup->reference_id,
                description: 'Isi saldo via '.($topup->paymentChannel?->name ?? 'payment gateway'),
            );

            $this->log($dto->outNo, "Top-up credited: Rp {$topup->amount}");
        });
    }
}

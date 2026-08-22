<?php

namespace App\Actions\Payment\Monetapay;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Service\ActivateServiceSubscriptionAction;
use App\Actions\Service\OpenServiceInvoicePaymentAction;
use App\Actions\Settlement\SettleMerchantTransactionAction;
use App\Actions\Withdrawal\HandleDisbursementCallbackAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Payment\Monetapay\MonetapayCallbackDTO;
use App\DTOs\Withdrawal\DisbursementCallbackDTO;
use App\Enums\PaymentStatus;
use App\Enums\ServiceInvoiceStatus;
use App\Enums\TransactionStatus;
use App\Jobs\ProcessUxiotopupTopup;
use App\Models\BalanceTopup;
use App\Models\Payment;
use App\Models\ServiceInvoicePayment;
use App\Models\Transaction;
use App\Support\Wallet\WalletLedger;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HandleMonetapayCallbackAction
{
    /**
     * Every payable that shares this webhook is told apart by its reference
     * prefix, so the lookup never has to fail first: wallet top-ups are `TOP-`,
     * service bills `SRV-`, and checkout — the fall-through — is `PAY-`.
     */
    private const TOPUP_REFERENCE_PREFIX = 'TOP-';

    private const SERVICE_REFERENCE_PREFIX = OpenServiceInvoicePaymentAction::REFERENCE_PREFIX;

    private const WITHDRAWAL_REFERENCE_PREFIX = 'WD-';

    public function __construct(
        private readonly CreateActivityLogAction $activityLogAction,
        private readonly SettleMerchantTransactionAction $settleAction,
        private readonly ActivateServiceSubscriptionAction $activateSubscriptionAction,
        private readonly HandleDisbursementCallbackAction $disbursementCallbackAction,
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

        // Service bills likewise: their own table, their own prefix, no
        // Transaction or Payment row.
        if (str_starts_with($dto->outNo, self::SERVICE_REFERENCE_PREFIX)) {
            $this->handleServiceInvoicePayment($dto);

            return;
        }

        // Monetapay delivers the payout (disbursement) callback to this same
        // account-level URL, not the dedicated /disbursement/merchant/callback.
        // Recognise it by our `WD-` order prefix or the payout-only beneficiary
        // fields, and hand it to the payout handler before the Payment lookup —
        // otherwise it falls through and 500s on a missing Payment row.
        if (str_starts_with($dto->outNo, self::WITHDRAWAL_REFERENCE_PREFIX) || $this->looksLikePayout($dto->rawPayload)) {
            $this->disbursementCallbackAction->execute(new DisbursementCallbackDTO(
                outNo: $dto->outNo,
                status: $dto->status,
                rawPayload: $dto->rawPayload,
            ));

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
            // `gateway_fee` is intentionally left as the per-channel percentage
            // frozen at checkout — settlement reads it to compute kita's profit.
            // Monetapay's own fee (extractGatewayFee) is not applied yet; wire it
            // in per gateway once the live callback key is confirmed.
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

        // ── Dispatch uxiotopup job after commit ──────────────────────────────
        // At this point DB::transaction() has returned, meaning the commit is done.
        // The queue worker will always see the PAID rows when it picks up the job.
        if ($paidTransaction) {
            // Credit the merchant and record kita's markup once payment is
            // confirmed. No-op for platform-owned sales (merchant_id = null).
            $this->settleAction->execute($paidTransaction);

            ProcessUxiotopupTopup::dispatch($paidTransaction);
        }
    }

    /**
     * Monetapay's fee field name has varied across payment types; pull the
     * first recognised key from the decrypted payload and treat anything
     * missing as no fee. The exact key can be pinned once confirmed against
     * live callbacks — until then this stays defensive rather than assuming.
     */
    /**
     * A payout (disbursement) callback carries beneficiary fields a pay-in
     * callback never does, and its order_no is batch-suffixed. Lets us route a
     * payout even when its mch_order_no predates our `WD-` prefix (foreign/legacy).
     */
    private function looksLikePayout(array $raw): bool
    {
        return isset($raw['account_number'])
            || (isset($raw['order_no']) && str_ends_with((string) $raw['order_no'], '_BATCH'));
    }

    private function extractGatewayFee(array $raw): int
    {
        foreach (['fee', 'mdr_fee', 'mdr', 'admin_fee', 'charge', 'total_fee'] as $key) {
            if (isset($raw[$key]) && is_numeric($raw[$key])) {
                return (int) round((float) $raw[$key]);
            }
        }

        return 0;
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

    /**
     * Marks a service bill paid and opens the subscription period it bought.
     *
     * Mirrors the wallet path's guarantees, because the failure modes are the
     * same and what is at stake here is a service the client either gets or
     * does not:
     *
     *  - the attempt row is locked for the whole read-modify-write, so two
     *    concurrent deliveries cannot both activate;
     *  - an attempt already in a terminal state is ignored, so a retried
     *    webhook opens one period, not two;
     *  - the paid amount must match the attempt exactly, so a tampered
     *    callback cannot buy a subscription for less than it costs;
     *  - the period is opened by the same action the manual confirmation uses,
     *    so the two can never disagree about how renewals stack.
     */
    private function handleServiceInvoicePayment(MonetapayCallbackDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            /** @var ServiceInvoicePayment|null $attempt */
            $attempt = ServiceInvoicePayment::where('reference_id', $dto->outNo)
                ->lockForUpdate()
                ->first();

            if (! $attempt) {
                Log::channel('monetapay')->warning('Monetapay callback for an unknown service payment reference', [
                    'reference_id' => $dto->outNo,
                ]);

                throw new Exception("No service invoice payment found for reference {$dto->outNo}.");
            }

            if ($attempt->status !== 'PENDING') {
                Log::channel('monetapay')->info("Service payment callback ignored — already {$attempt->status}", [
                    'reference_id' => $dto->outNo,
                ]);

                return;
            }

            if ((int) $attempt->total !== (int) $dto->amount) {
                $this->log(
                    $dto->outNo,
                    "FRAUD: service payment amount mismatch. Expected {$attempt->total}, received {$dto->amount}."
                );

                throw new Exception("Amount mismatch for service payment {$dto->outNo}.");
            }

            $isSuccess = \in_array(\strtolower($dto->status), ['1', '3', 'success'], true);

            if (! $isSuccess) {
                $attempt->update(['status' => 'EXPIRED']);
                $this->log($dto->outNo, "Service payment failed — Monetapay status: {$dto->status}");

                return;
            }

            $attempt->update(['status' => 'PAID', 'paid_at' => now()]);

            $invoice = $attempt->invoice()->lockForUpdate()->first();

            // A payment-internal user may have marked this bill paid by hand
            // while the callback was in flight. The money is still recorded on
            // the attempt above; opening a second period is what must not
            // happen.
            if (! $invoice || $invoice->status === ServiceInvoiceStatus::PAID) {
                $this->log($dto->outNo, 'Service payment received for an invoice already settled.');

                return;
            }

            $invoice->update([
                'status' => ServiceInvoiceStatus::PAID,
                'verified_at' => now(),
            ]);

            $this->activateSubscriptionAction->execute($invoice);

            $this->log($dto->outNo, "Service invoice {$invoice->invoice_number} paid: Rp {$attempt->total}");
        });
    }
}

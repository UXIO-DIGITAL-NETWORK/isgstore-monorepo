<?php

namespace App\Jobs;

use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use App\Services\DiscordWebhookService;
use App\Services\Payment\MonetapayService;
use App\Support\Integration\IntegrationConfig;
use App\Support\Payout\BankCatalog;
use App\Support\Wallet\WalletLedger;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Disburse an approved withdrawal via Monetapay (7.x disbursement).
 *
 * Mirrors RefundGatewayJob's guarantees: queued with retries so a transient
 * gateway outage doesn't strand a payout; the disbursement order number is the
 * withdrawal number so Monetapay deduplicates a double request; the row is
 * re-checked under lock and skipped once terminal. The merchant is paid `nett`
 * (amount − kita's fee).
 *
 * This job only *hands off* the payout: a successful create leaves the row
 * PROCESSING, and the async /disbursement/merchant/callback settles it (SETTLED,
 * realising the fee) or fails it (FAILED, refunding the hold). The job's own
 * refund path below covers the other failure — the create being rejected or all
 * retries exhausted, so the payout never even reached Monetapay.
 */
class ProcessWithdrawalPayoutJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    /** @var array<int, int> */
    public array $backoff = [60, 300, 900, 3600];

    public function __construct(public Withdrawal $withdrawal) {}

    public function handle(MonetapayService $monetapay): void
    {
        $current = DB::transaction(function () {
            /** @var Withdrawal|null $locked */
            $locked = Withdrawal::whereKey($this->withdrawal->getKey())->lockForUpdate()->first();

            if ($locked && in_array($locked->status, [WithdrawalStatus::APPROVED, WithdrawalStatus::PROCESSING], true)) {
                $locked->update(['status' => WithdrawalStatus::PROCESSING]);

                return $locked;
            }

            return null;
        });

        // Already terminal / picked up by another worker.
        if (! $current) {
            return;
        }

        // The beneficiary phone: the e-wallet number for e-wallet payouts, else
        // the disbursement account_phone. Falls back to the merchant's phone then
        // a placeholder so the field is always present (postSigned() drops it from
        // the signed map only if it is blank).
        $accountPhone = (string) ($current->account_phone ?: $current->merchant?->phone ?: '08123456789');
        $isEwallet = BankCatalog::isEwallet((string) $current->bank_code);

        // HTTP call runs outside any DB transaction so no row lock spans it.
        // Field set follows the official /v1.0.0/disbursement spec exactly:
        // mch_order_no, amount, account_name, account_bank_code, account_number,
        // account_phone, notes (+ app_id/timestamp/sign injected by postSigned).
        // No `currency` field — the payout spec does not define one, unlike pay-in.
        // E-wallet payouts have no account number.
        $response = $isEwallet
            ? $monetapay->createEwalletPayout([
                'mch_order_no' => $current->withdrawal_number,
                'amount' => (string) $current->nett,
                'account_bank_code' => $current->bank_code,
                'account_name' => $current->account_name,
                'account_phone' => $accountPhone,
                'notes' => $current->notes ?: "Pencairan {$current->withdrawal_number}",
            ])
            : $monetapay->createDisbursement([
                'mch_order_no' => $current->withdrawal_number,
                'amount' => (string) $current->nett,
                'account_bank_code' => $current->bank_code,
                'account_name' => $current->account_name,
                'account_number' => $current->account_number,
                'account_phone' => $accountPhone,
                'notes' => $current->notes ?: "Pencairan {$current->withdrawal_number}",
            ]);

        $code = $response['code'] ?? null;
        if (! in_array($code, [0, 200, '0', '200'], true) && strtolower((string) ($response['message'] ?? '')) !== 'success') {
            // Prod runs at LOG_LEVEL=error, so the service's debug pre-flight is
            // invisible. Log the effective app_id + business params (no secrets)
            // and the raw response here so a generic code:-1 "failure" is
            // diagnosable — a mch_id fallback for `disbursement_app_id` is the
            // usual cause (Monetapay rejects an app_id not registered for payout).
            Log::channel('monetapay')->error('Withdrawal payout rejected by Monetapay', [
                'withdrawal_number' => $current->withdrawal_number,
                'method' => $isEwallet ? 'ewallet' : 'bank',
                'disbursement_app_id' => (string) (IntegrationConfig::for('monetapay')['disbursement_app_id'] ?? ''),
                'request' => [
                    'amount' => $current->nett,
                    'account_bank_code' => $current->bank_code,
                    'account_number' => $current->account_number,
                    'account_phone' => $accountPhone,
                ],
                'response' => $response,
            ]);

            throw new Exception('Monetapay disbursement rejected: '.json_encode($response));
        }

        // A successful create only means Monetapay *accepted* the payout (create
        // response status 0 = Processing). The final SETTLED/FAILED — and kita's
        // fee — are decided by the async /disbursement/merchant/callback, handled
        // in HandleDisbursementCallbackAction. Record the gateway ref and wait.
        $current->update([
            'disbursement_ref' => $response['data']['order_no'] ?? null,
            'payout_data' => $response['data'] ?? null,
        ]);

        Log::channel('monetapay')->info("Withdrawal payout accepted, awaiting callback: {$current->withdrawal_number} (Rp {$current->nett})");
    }

    public function failed(Throwable $e): void
    {
        // Refund the hold and mark the request failed so the merchant's money
        // is returned rather than stranded.
        DB::transaction(function () {
            /** @var Withdrawal|null $locked */
            $locked = Withdrawal::whereKey($this->withdrawal->getKey())->lockForUpdate()->first();

            if (! $locked || $locked->status === WithdrawalStatus::FAILED || $locked->status === WithdrawalStatus::SETTLED) {
                return;
            }

            WalletLedger::record(
                user: $locked->merchant_id,
                amount: (int) $locked->amount,
                type: 'refund',
                reference: $locked->withdrawal_number,
                description: "Penarikan {$locked->withdrawal_number} gagal — dana dikembalikan",
            );

            $locked->update(['status' => WithdrawalStatus::FAILED]);
        });

        Log::channel('monetapay')->error("ProcessWithdrawalPayoutJob: retries exhausted for {$this->withdrawal->withdrawal_number}: {$e->getMessage()}");

        app(DiscordWebhookService::class)->sendEmbed(
            '[MONETAPAY] 🚨 Withdrawal Payout Failed',
            [],
            DiscordWebhookService::COLOR_RED,
            "Withdrawal `{$this->withdrawal->withdrawal_number}` (Rp ".number_format($this->withdrawal->nett).') failed after all retries — hold refunded to merchant.'
        );
    }
}

<?php

namespace App\Jobs;

use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use App\Services\DiscordWebhookService;
use App\Services\Payment\MonetapayService;
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

        // HTTP call runs outside any DB transaction so no row lock spans it.
        // Mirror the field set of the proven pay-in createTransaction(): Monetapay
        // rejects a disbursement missing `currency` (and expects `account_phone`)
        // with a generic code:-1 "failure". account_phone falls back to the
        // merchant's phone, then a placeholder, so the field is always present —
        // postSigned() drops it from the signed map only if it is blank.
        $response = $monetapay->createDisbursement([
            'mch_order_no' => $current->withdrawal_number,
            'amount' => (string) $current->nett,
            'currency' => 'IDR',
            'account_bank_code' => $current->bank_code,
            'account_name' => $current->account_name,
            'account_number' => $current->account_number,
            'account_phone' => (string) ($current->merchant?->phone ?: '08123456789'),
            'notes' => $current->notes ?: "Pencairan {$current->withdrawal_number}",
        ]);

        $code = $response['code'] ?? null;
        if (! in_array($code, [0, 200, '0', '200'], true) && strtolower((string) ($response['message'] ?? '')) !== 'success') {
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

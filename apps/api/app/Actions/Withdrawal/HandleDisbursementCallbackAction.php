<?php

declare(strict_types=1);

namespace App\Actions\Withdrawal;

use App\DTOs\Withdrawal\DisbursementCallbackDTO;
use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use App\Support\Ledger\WithdrawalFeeLedger;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Drives a payout to its terminal state from Monetapay's async callback (7.4.2)
 * — the real step 4. The disbursement create only *accepts* the payout
 * (status 0), so ProcessWithdrawalPayoutJob leaves the row PROCESSING; the final
 * success/failure lands here.
 *
 * Monetapay payout status: "1" Successful → SETTLED + realise kita's fee;
 * "2" Failed → FAILED + refund the held amount to the merchant; "0" Processing
 * → stay PROCESSING (an intermediate ping). The whole thing is idempotent: a row
 * already terminal is a no-op, so Monetapay's retries never double-book a fee or
 * double-refund a hold.
 */
class HandleDisbursementCallbackAction
{
    public function execute(DisbursementCallbackDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            /** @var Withdrawal|null $withdrawal */
            $withdrawal = Withdrawal::where('withdrawal_number', $dto->outNo)
                ->lockForUpdate()
                ->first();

            if (! $withdrawal) {
                // Unknown order — a payout we never issued (a foreign/legacy
                // disbursement sharing our account's callback URL). Ack it (200)
                // and log, rather than 500 into an infinite Monetapay retry loop.
                Log::channel('monetapay')->warning('Disbursement callback for an unknown withdrawal', [
                    'mch_order_no' => $dto->outNo,
                    'status' => $dto->status,
                ]);

                return;
            }

            // Terminal already (a duplicate/late callback) — nothing to do.
            if (in_array($withdrawal->status, [
                WithdrawalStatus::SETTLED,
                WithdrawalStatus::FAILED,
                WithdrawalStatus::REJECTED,
            ], true)) {
                return;
            }

            switch ((string) $dto->status) {
                case '1': // Successful — funds delivered.
                    $withdrawal->update([
                        'status' => WithdrawalStatus::SETTLED,
                        'disbursement_ref' => $dto->rawPayload['order_no'] ?? $withdrawal->disbursement_ref,
                        'payout_data' => $dto->rawPayload,
                    ]);
                    // Realise kita's withdraw fee now the payout actually settled.
                    // Idempotent and shared with the manual-approval path.
                    WithdrawalFeeLedger::credit($withdrawal);
                    break;

                case '2': // Failed — return the held amount to the merchant.
                    // The hold debited the full `amount` at request time; refund
                    // the same so the merchant is made whole.
                    WalletLedger::record(
                        user: (int) $withdrawal->merchant_id,
                        amount: (int) $withdrawal->amount,
                        type: 'refund',
                        reference: $withdrawal->withdrawal_number,
                        description: "Penarikan {$withdrawal->withdrawal_number} gagal — dana dikembalikan",
                    );
                    $withdrawal->update([
                        'status' => WithdrawalStatus::FAILED,
                        'failure_reason' => $dto->rawPayload['error_msg'] ?? null,
                        'payout_data' => $dto->rawPayload,
                    ]);
                    break;

                default: // "0" Processing (or anything unknown) — keep waiting.
                    $withdrawal->update(['payout_data' => $dto->rawPayload]);
                    break;
            }
        });

        Log::channel('monetapay')->info('Withdrawal disbursement callback processed', [
            'mch_order_no' => $dto->outNo,
            'status' => $dto->status,
        ]);
    }
}

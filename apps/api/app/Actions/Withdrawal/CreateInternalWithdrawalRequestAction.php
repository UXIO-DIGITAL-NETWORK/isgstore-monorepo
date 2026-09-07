<?php

declare(strict_types=1);

namespace App\Actions\Withdrawal;

use App\Actions\Notification\NotifyPaymentInternalAction;
use App\DTOs\Withdrawal\CreateInternalWithdrawalDTO;
use App\Enums\WithdrawalStatus;
use App\Models\PlatformAccount;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Ledger\PlatformLedger;
use App\Support\Wallet\PlatformBalance;
use App\Support\Withdrawal\WithdrawalFeeCalculator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Kita ("payment-internal") requests a payout of the platform's own profit —
 * same scheme as a merchant withdrawal (CreateWithdrawalRequestAction), but
 * against PlatformBalance instead of a merchant's sales, with no merchant on
 * the row (`merchant_id` null, `requested_by` set to the internal requester).
 *
 * The requested amount is checked against PlatformBalance::available() while
 * holding the platform_accounts row FOR UPDATE — the same row PlatformLedger
 * locks for every mutation — so two concurrent internal requests can't both
 * pass the check against the same unspent balance.
 *
 * A caller that cannot see the outcome of its own request (the Hub, over the
 * network) sends an `idempotencyKey`. Replaying it returns the ORIGINAL row
 * rather than creating a second withdrawal, so a retry after a lost ack is
 * safe. The lookup runs inside the same locked transaction as the balance
 * check, and the unique index is the real guard — two simultaneous replays
 * cannot both find nothing and both insert.
 */
class CreateInternalWithdrawalRequestAction
{
    public function execute(CreateInternalWithdrawalDTO $dto): Withdrawal
    {
        $replayed = false;

        $withdrawal = DB::transaction(function () use ($dto, &$replayed) {
            $fee = WithdrawalFeeCalculator::fee();
            $nett = $dto->amount - $fee;

            if ($nett <= 0) {
                throw new RuntimeException('Nominal penarikan terlalu kecil untuk menutup biaya.');
            }

            PlatformAccount::where('code', PlatformLedger::DEFAULT_ACCOUNT)->lockForUpdate()->firstOrFail();

            // Before the balance check, not after: a replay must succeed even
            // once the balance it originally spent is gone, or the caller would
            // read "saldo tidak mencukupi" for a withdrawal that already exists.
            if ($dto->idempotencyKey !== null) {
                $existing = Withdrawal::where('idempotency_key', $dto->idempotencyKey)->first();

                if ($existing !== null) {
                    $replayed = true;

                    return $existing;
                }
            }

            if ($dto->amount > PlatformBalance::available()) {
                throw new RuntimeException('Saldo platform tidak mencukupi untuk penarikan ini.');
            }

            $number = 'WD-'.Str::lower(Str::random(12));

            return Withdrawal::create([
                'merchant_id' => null,
                'requested_by' => $dto->requestedBy,
                'withdrawal_number' => $number,
                'idempotency_key' => $dto->idempotencyKey,
                'amount' => $dto->amount,
                'fee' => $fee,
                'nett' => $nett,
                'bank_code' => $dto->bankCode,
                'account_number' => $dto->accountNumber,
                'account_name' => $dto->accountName,
                'account_phone' => $dto->accountPhone,
                'status' => WithdrawalStatus::PENDING,
                'notes' => $dto->notes,
            ]);
        });

        // A replay is not a new request: notifying again would tell finance a
        // second withdrawal was raised when nothing changed.
        if ($replayed) {
            return $withdrawal;
        }

        $requesterName = User::find($dto->requestedBy)?->name ?? "User #{$dto->requestedBy}";
        app(NotifyPaymentInternalAction::class)->execute(
            type: 'internal_withdrawal_request',
            title: 'Penarikan internal',
            message: "{$requesterName} mengajukan penarikan internal {$withdrawal->withdrawal_number} Rp ".number_format((int) $withdrawal->amount),
            data: [
                'withdrawal_number' => $withdrawal->withdrawal_number,
                'requested_by' => $dto->requestedBy,
                'amount' => (int) $withdrawal->amount,
            ],
        );

        return $withdrawal;
    }
}

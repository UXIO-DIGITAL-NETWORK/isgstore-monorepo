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
 */
class CreateInternalWithdrawalRequestAction
{
    public function execute(CreateInternalWithdrawalDTO $dto): Withdrawal
    {
        $withdrawal = DB::transaction(function () use ($dto) {
            $fee = WithdrawalFeeCalculator::fee();
            $nett = $dto->amount - $fee;

            if ($nett <= 0) {
                throw new RuntimeException('Nominal penarikan terlalu kecil untuk menutup biaya.');
            }

            PlatformAccount::where('code', PlatformLedger::DEFAULT_ACCOUNT)->lockForUpdate()->firstOrFail();

            if ($dto->amount > PlatformBalance::available()) {
                throw new RuntimeException('Saldo platform tidak mencukupi untuk penarikan ini.');
            }

            $number = 'WD-'.Str::lower(Str::random(12));

            return Withdrawal::create([
                'merchant_id' => null,
                'requested_by' => $dto->requestedBy,
                'withdrawal_number' => $number,
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

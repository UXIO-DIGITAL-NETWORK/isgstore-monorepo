<?php

declare(strict_types=1);

namespace App\Actions\Withdrawal;

use App\DTOs\Withdrawal\CreateWithdrawalDTO;
use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * A merchant ("client") requests a payout from its wallet balance.
 *
 * The funds are held immediately: the balance is debited via WalletLedger when
 * the request is created, so a merchant can never have more pending withdrawals
 * than it holds, and the ledger records the movement. Kita later approves (the
 * hold becomes a real transfer) or rejects (the hold is credited back).
 *
 * `fee` is kita's withdraw markup; `nett` = amount − fee is what reaches the
 * merchant. The fee schedule is a flat + percent read from config for now;
 * Phase 2's admin-fee settings will drive it.
 */
class CreateWithdrawalRequestAction
{
    public function execute(CreateWithdrawalDTO $dto): Withdrawal
    {
        return DB::transaction(function () use ($dto) {
            $fee = $this->resolveFee($dto->amount);
            $nett = $dto->amount - $fee;

            $number = 'WD-'.Str::lower(Str::random(12));

            // Hold the funds. WalletLedger locks the merchant row and throws if
            // the balance is insufficient, so this is the balance guard too.
            WalletLedger::record(
                user: $dto->merchantId,
                amount: -$dto->amount,
                type: 'withdrawal',
                reference: $number,
                description: "Penarikan {$number}",
            );

            return Withdrawal::create([
                'merchant_id' => $dto->merchantId,
                'withdrawal_number' => $number,
                'amount' => $dto->amount,
                'fee' => $fee,
                'nett' => $nett,
                'bank_code' => $dto->bankCode,
                'account_number' => $dto->accountNumber,
                'account_name' => $dto->accountName,
                'status' => WithdrawalStatus::PENDING,
                'notes' => $dto->notes,
            ]);
        });
    }

    private function resolveFee(int $amount): int
    {
        $flat = (int) config('services.withdrawal.fee_flat', 0);
        $percent = (float) config('services.withdrawal.fee_percent', 0);

        return $flat + (int) round($amount * ($percent / 100));
    }
}

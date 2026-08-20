<?php

declare(strict_types=1);

namespace App\Actions\Withdrawal;

use App\Actions\Notification\NotifyPaymentInternalAction;
use App\DTOs\Withdrawal\CreateWithdrawalDTO;
use App\Enums\WithdrawalStatus;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Wallet\MerchantBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * A merchant ("client") requests a payout.
 *
 * The withdrawable balance is derived live from sales (MerchantBalance), not a
 * stored `users.balance`: available = paid sales − non-refunded withdrawals. The
 * new request itself becomes part of that hold — once PENDING it is counted, so
 * a merchant can never have more open+settled withdrawals than it has earned.
 * Kita later approves (settles) or rejects/fails (the withdrawal drops out of
 * the hold and the balance recovers on its own — no ledger reversal needed).
 *
 * `fee` is kita's withdraw markup; `nett` = amount − fee is what reaches the
 * merchant. The fee is a flat charge: `fee_flat + fee_percent% of fee_flat`
 * (1500 + 11% × 1500 = 1665 with the defaults), the same for every withdrawal
 * regardless of amount. Read from config for now; Phase 2's admin-fee settings
 * will drive it.
 */
class CreateWithdrawalRequestAction
{
    public function execute(CreateWithdrawalDTO $dto): Withdrawal
    {
        $withdrawal = DB::transaction(function () use ($dto) {
            $fee = $this->resolveFee();
            $nett = $dto->amount - $fee;

            // Defensive floor behind StoreWithdrawalRequest's min_amount rule: a
            // payout must deliver something. Controller maps this to a 422.
            if ($nett <= 0) {
                throw new RuntimeException('Nominal penarikan terlalu kecil untuk menutup biaya.');
            }

            // Serialise concurrent requests from the same merchant on its user
            // row, then check the requested amount against the live available
            // balance (sales − existing non-refunded withdrawals). Locking the
            // row makes the read-then-create atomic even though no balance column
            // is written.
            User::whereKey($dto->merchantId)->lockForUpdate()->firstOrFail();

            if ($dto->amount > MerchantBalance::available($dto->merchantId)) {
                throw new RuntimeException('Saldo tidak mencukupi untuk penarikan ini.');
            }

            $number = 'WD-'.Str::lower(Str::random(12));

            return Withdrawal::create([
                'merchant_id' => $dto->merchantId,
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

        // Alert the internal team that a client wants to withdraw, so an approver
        // picks it up. Fires after commit — the hold and the row already exist.
        $merchantName = $withdrawal->merchant?->name ?? "Client #{$dto->merchantId}";
        app(NotifyPaymentInternalAction::class)->execute(
            type: 'withdrawal_request',
            title: 'Permintaan penarikan',
            message: "{$merchantName} mengajukan penarikan {$withdrawal->withdrawal_number} Rp ".number_format((int) $withdrawal->amount),
            data: [
                'withdrawal_number' => $withdrawal->withdrawal_number,
                'merchant_id' => $dto->merchantId,
                'amount' => (int) $withdrawal->amount,
            ],
        );

        return $withdrawal;
    }

    /**
     * Flat withdrawal fee, independent of the amount:
     * fee_flat + fee_percent% of fee_flat (1500 + 11% × 1500 = 1665).
     */
    private function resolveFee(): int
    {
        $flat = (int) config('services.withdrawal.fee_flat', 0);
        $percent = (float) config('services.withdrawal.fee_percent', 0);

        return $flat + (int) round($flat * ($percent / 100));
    }
}

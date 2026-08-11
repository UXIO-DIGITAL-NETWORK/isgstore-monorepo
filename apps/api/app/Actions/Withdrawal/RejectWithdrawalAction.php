<?php

declare(strict_types=1);

namespace App\Actions\Withdrawal;

use App\Enums\WithdrawalStatus;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Kita rejects a pending withdrawal.
 *
 * The amount held at request time is credited back to the merchant's balance
 * (via WalletLedger, keyed on the withdrawal number so it is auditable) and the
 * request moves to the terminal REJECTED state.
 */
class RejectWithdrawalAction
{
    public function execute(Withdrawal $withdrawal, User $approver, ?string $reason = null): Withdrawal
    {
        return DB::transaction(function () use ($withdrawal, $approver, $reason) {
            /** @var Withdrawal $locked */
            $locked = Withdrawal::whereKey($withdrawal->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status !== WithdrawalStatus::PENDING) {
                throw new RuntimeException('Penarikan ini sudah diproses.');
            }

            WalletLedger::record(
                user: $locked->merchant_id,
                amount: (int) $locked->amount,
                type: 'refund',
                reference: $locked->withdrawal_number,
                description: "Penarikan {$locked->withdrawal_number} ditolak",
            );

            $locked->update([
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'status' => WithdrawalStatus::REJECTED,
                'notes' => $reason ?? $locked->notes,
            ]);

            return $locked->fresh();
        });
    }
}

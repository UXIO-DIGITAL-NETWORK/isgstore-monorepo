<?php

declare(strict_types=1);

namespace App\Actions\Withdrawal;

use App\Enums\WithdrawalStatus;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Kita rejects a pending withdrawal.
 *
 * The request moves to the terminal REJECTED state. No balance reversal is
 * needed: the withdrawable balance is derived live from sales minus non-refunded
 * withdrawals (App\Support\Wallet\MerchantBalance), and a REJECTED row is
 * excluded from that hold — so the merchant's available balance recovers on its
 * own the moment the status flips.
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

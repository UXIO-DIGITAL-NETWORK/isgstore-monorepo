<?php

declare(strict_types=1);

namespace App\Actions\Withdrawal;

use App\Enums\WithdrawalStatus;
use App\Jobs\ProcessWithdrawalPayoutJob;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Kita approves a pending withdrawal.
 *
 * Two paths, matching how kita actually pays out:
 *   - 'manual'  — kita transfers out-of-band and records it as done. The hold
 *                 already debited the merchant, so approval just marks SETTLED.
 *   - 'monetapay' — hand the payout to Monetapay disbursement asynchronously;
 *                 the job settles on success or refunds the hold on failure.
 *
 * The funds were already held at request time, so approval moves state only —
 * it never debits again.
 */
class ApproveWithdrawalAction
{
    public function execute(Withdrawal $withdrawal, User $approver, string $method = 'manual'): Withdrawal
    {
        $fresh = DB::transaction(function () use ($withdrawal, $approver, $method) {
            /** @var Withdrawal $locked */
            $locked = Withdrawal::whereKey($withdrawal->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status !== WithdrawalStatus::PENDING) {
                throw new RuntimeException('Penarikan ini sudah diproses.');
            }

            $locked->update([
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'status' => $method === 'monetapay'
                    ? WithdrawalStatus::APPROVED
                    : WithdrawalStatus::SETTLED,
            ]);

            return $locked->fresh();
        });

        // Dispatch after commit so the worker sees the APPROVED row.
        if ($method === 'monetapay') {
            ProcessWithdrawalPayoutJob::dispatch($fresh);
        }

        return $fresh;
    }
}

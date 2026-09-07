<?php

namespace App\Actions\User;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\User;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\Auth;

/**
 * Manual wallet credit/debit by an admin. The direction (not a sign) decides
 * credit vs debit; the movement goes through WalletLedger so it lands in
 * balance_mutations with before/after figures and never desyncs the balance.
 */
class AdjustUserBalanceAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(User $user, int $amount, string $direction, string $reason): User
    {
        $signed = $direction === 'debit' ? -$amount : $amount;

        // `type` is the balance_mutations enum (topup|purchase|refund|adjustment);
        // an admin credit/debit is an `adjustment`, and the signed amount already
        // carries the direction.
        WalletLedger::record(
            $user,
            $signed,
            type: 'adjustment',
            reference: 'admin-adjustment',
            description: $reason,
        );

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin {$direction} of {$amount} to {$user->name}'s balance: {$reason}",
        ));

        return $user->refresh();
    }
}

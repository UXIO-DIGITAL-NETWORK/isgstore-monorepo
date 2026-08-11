<?php

declare(strict_types=1);

namespace App\Support\Ledger;

use App\Models\PlatformAccount;
use App\Models\PlatformMutation;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The single place a platform ("kita") account balance is allowed to move.
 *
 * Symmetrical to App\Support\Wallet\WalletLedger, but the locked row is a
 * platform_accounts row rather than a user. Every change locks that row,
 * records a platform_mutations entry with before/after figures, and writes the
 * new balance in the same transaction — so kita's saldo is auditable rather
 * than recomputed on demand.
 */
final class PlatformLedger
{
    public const DEFAULT_ACCOUNT = 'default';

    /**
     * @param  int  $amount  Positive to credit, negative to debit.
     */
    public static function record(
        int $amount,
        string $type,
        ?string $reference = null,
        ?string $description = null,
        string $accountCode = self::DEFAULT_ACCOUNT,
    ): PlatformMutation {
        if ($amount === 0) {
            throw new RuntimeException('A zero-amount platform mutation is meaningless.');
        }

        return DB::transaction(function () use ($amount, $type, $reference, $description, $accountCode) {
            /** @var PlatformAccount $account */
            $account = PlatformAccount::where('code', $accountCode)->lockForUpdate()->firstOrFail();

            $before = (int) $account->balance;
            $after = $before + $amount;

            $account->forceFill(['balance' => $after])->save();

            return PlatformMutation::create([
                'platform_account_id' => $account->id,
                'type' => $type,
                'amount' => $amount,
                'balance_before' => $before,
                'balance_after' => $after,
                'reference' => $reference,
                'description' => $description,
            ]);
        });
    }
}

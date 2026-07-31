<?php

declare(strict_types=1);

namespace App\Support\Wallet;

use App\Models\BalanceMutation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The single place `users.balance` is allowed to move.
 *
 * Every change locks the user row, records a `balance_mutations` entry with
 * the before/after figures, and writes the new balance in the same
 * transaction. Routing all movement through one method is what makes the
 * ledger trustworthy: a balance changed anywhere else would leave a gap
 * nobody could reconcile.
 *
 * Callers must already be inside a DB transaction when they need the credit to
 * be atomic with their own writes (the Monetapay callback does exactly this).
 */
final class WalletLedger
{
    /**
     * @param  int  $amount  Positive to credit, negative to debit.
     */
    public static function record(
        User|int $user,
        int $amount,
        string $type,
        ?string $reference = null,
        ?string $description = null,
    ): BalanceMutation {
        if ($amount === 0) {
            throw new RuntimeException('A zero-amount wallet mutation is meaningless.');
        }

        $userId = $user instanceof User ? $user->id : $user;

        return DB::transaction(function () use ($userId, $amount, $type, $reference, $description) {
            // Locked for the whole read-modify-write: two concurrent credits
            // reading the same balance would otherwise both write the same
            // "after" figure and silently lose one of them.
            /** @var User $locked */
            $locked = User::whereKey($userId)->lockForUpdate()->firstOrFail();

            $before = (int) $locked->balance;
            $after = $before + $amount;

            if ($after < 0) {
                throw new RuntimeException('Saldo tidak mencukupi untuk transaksi ini.');
            }

            $locked->forceFill(['balance' => $after])->save();

            return BalanceMutation::create([
                'user_id' => $userId,
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

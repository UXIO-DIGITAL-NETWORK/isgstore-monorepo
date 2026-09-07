<?php

declare(strict_types=1);

namespace App\Support\Points;

use App\Models\PointLedgerEntry;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The single place `users.point` is allowed to move.
 *
 * A line-for-line mirror of `App\Support\Wallet\WalletLedger`, deliberately:
 * points are worth money, and the reasoning that made the wallet trustworthy —
 * one writer, a row lock over the whole read-modify-write, before/after figures
 * on every entry — applies unchanged. A balance changed anywhere else would
 * leave a gap nobody could reconcile.
 *
 * Callers must already be inside a DB transaction when they need the movement
 * to be atomic with their own writes (checkout does exactly this).
 */
final class PointLedger
{
    /**
     * @param  int  $amount  Positive to credit, negative to debit.
     */
    public static function record(
        User|int $user,
        int $amount,
        string $type,
        ?int $transactionId = null,
        ?string $reference = null,
        ?string $description = null,
    ): PointLedgerEntry {
        if ($amount === 0) {
            throw new RuntimeException('A zero-amount point mutation is meaningless.');
        }

        $userId = $user instanceof User ? $user->id : $user;

        return DB::transaction(function () use ($userId, $amount, $type, $transactionId, $reference, $description) {
            // Locked for the whole read-modify-write: two concurrent credits
            // reading the same balance would otherwise both write the same
            // "after" figure and silently lose one.
            /** @var User $locked */
            $locked = User::whereKey($userId)->lockForUpdate()->firstOrFail();

            $before = (int) $locked->point;
            $after = $before + $amount;

            if ($after < 0) {
                throw new RuntimeException('Poin tidak mencukupi untuk transaksi ini.');
            }

            $locked->forceFill(['point' => $after])->save();

            return PointLedgerEntry::create([
                'user_id' => $userId,
                'transaction_id' => $transactionId,
                'type' => $type,
                'amount' => $amount,
                'points_before' => $before,
                'points_after' => $after,
                'reference' => $reference,
                'description' => $description,
            ]);
        });
    }

    /**
     * How many points this account can actually spend right now.
     *
     * Read outside a lock — the authoritative check is inside `record()`, which
     * refuses to take the balance negative. This is for quoting and for form
     * validation, where a stale figure is harmless.
     */
    public static function balanceFor(User|int $user): int
    {
        $userId = $user instanceof User ? $user->id : $user;

        return (int) (User::whereKey($userId)->value('point') ?? 0);
    }
}

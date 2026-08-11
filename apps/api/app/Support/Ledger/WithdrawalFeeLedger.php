<?php

declare(strict_types=1);

namespace App\Support\Ledger;

use App\Models\PlatformMutation;
use App\Models\Withdrawal;

/**
 * Books a settled withdrawal's `fee` as kita's income on the platform ledger.
 *
 * At request time the merchant is debited the full `amount`; `nett` reaches the
 * bank and `fee` is kita's withdraw markup. That markup is only realised once
 * the payout actually settles, so it is credited here — symmetrical to how
 * SettleMerchantTransactionAction books sale markup via PlatformLedger.
 *
 * Idempotent: keyed on one `withdrawal_fee` platform mutation per withdrawal
 * number, so both settle paths (manual approval + the Monetapay payout job) and
 * any retry credit exactly once. A zero fee is a no-op (PlatformLedger rejects
 * zero-amount mutations).
 */
final class WithdrawalFeeLedger
{
    public static function credit(Withdrawal $withdrawal): void
    {
        $fee = (int) $withdrawal->fee;
        if ($fee <= 0) {
            return;
        }

        $reference = $withdrawal->withdrawal_number;

        $already = PlatformMutation::query()
            ->where('type', 'withdrawal_fee')
            ->where('reference', $reference)
            ->exists();

        if ($already) {
            return;
        }

        PlatformLedger::record(
            amount: $fee,
            type: 'withdrawal_fee',
            reference: $reference,
            description: "Fee penarikan {$reference}",
        );
    }
}

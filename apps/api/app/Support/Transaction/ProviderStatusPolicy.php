<?php

declare(strict_types=1);

namespace App\Support\Transaction;

use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;

/**
 * The compatibility rules between `transactions.status` and
 * `transactions.provider_status`.
 *
 * Two columns describing overlapping facts will drift unless something makes
 * drift impossible. Roughly a dozen places write `transactions.status`; asking
 * each of them to remember a second column is a rule that survives exactly until
 * the next person adds the thirteenth. So this class states, for every status,
 * what the provider column must default to and what it is even allowed to be —
 * and `TransactionObserver` applies it to every save.
 *
 * Pure and DB-free on purpose, so the matrix is unit-testable on its own.
 */
final class ProviderStatusPolicy
{
    /**
     * What `provider_status` becomes when a caller changes `status` without
     * saying anything about the provider.
     *
     * REFUNDED returns null meaning "leave it alone" — see keepsPreviousOn().
     */
    public static function defaultFor(TransactionStatus $status): ?ProviderStatus
    {
        return match ($status) {
            TransactionStatus::PENDING,
            TransactionStatus::EXPIRED => ProviderStatus::NOT_ORDERED,
            TransactionStatus::PAID => ProviderStatus::QUEUED,
            TransactionStatus::PROCESSING => ProviderStatus::SENDING,
            TransactionStatus::COMPLETED => ProviderStatus::DELIVERED,
            TransactionStatus::FAILED_PROVIDER => ProviderStatus::REJECTED,
            TransactionStatus::REFUNDED => null,
        };
    }

    /**
     * REFUNDED preserves whatever the provider column already held.
     *
     * This is the single most valuable rule in the file. A refund records that
     * money came back; it says nothing about whether the supplier delivered. Today
     * `status = REFUNDED` erases that fact outright, so "the supplier failed and we
     * refunded" is indistinguishable from "the supplier delivered and an admin
     * refunded anyway as goodwill". Keeping the prior value is also why
     * InitiateRefundAction and CompleteRefundRequestAction need no changes at all.
     */
    public static function keepsPreviousOn(TransactionStatus $status): bool
    {
        return $status === TransactionStatus::REFUNDED;
    }

    /**
     * Every provider state that can honestly coexist with a given status.
     *
     * FAILED_PROVIDER admits NOT_ORDERED because an admin can mark a never-ordered
     * row failed by hand through manual review.
     *
     * @return array<int, ProviderStatus>
     */
    public static function allowedFor(TransactionStatus $status): array
    {
        return match ($status) {
            TransactionStatus::PENDING,
            TransactionStatus::EXPIRED => [ProviderStatus::NOT_ORDERED],

            TransactionStatus::PAID => [
                ProviderStatus::NOT_ORDERED,
                ProviderStatus::QUEUED,
            ],

            TransactionStatus::PROCESSING => [
                ProviderStatus::QUEUED,
                ProviderStatus::SENDING,
                ProviderStatus::ORDERED,
                ProviderStatus::UNCONFIRMED,
            ],

            TransactionStatus::COMPLETED => [ProviderStatus::DELIVERED],

            TransactionStatus::FAILED_PROVIDER => [
                ProviderStatus::NOT_ORDERED,
                ProviderStatus::REJECTED,
                ProviderStatus::UNDELIVERED,
            ],

            // A refund can follow any provider outcome, including a successful one.
            TransactionStatus::REFUNDED => ProviderStatus::cases(),
        };
    }

    public static function allows(TransactionStatus $status, ProviderStatus $provider): bool
    {
        return in_array($provider, self::allowedFor($status), true);
    }
}

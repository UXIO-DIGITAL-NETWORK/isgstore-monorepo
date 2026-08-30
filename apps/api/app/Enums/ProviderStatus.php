<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * transactions.provider_status — did the SUPPLIER (uxiotopup) deliver?
 *
 * `TransactionStatus` conflates two independent lifecycles: whether the customer
 * paid (Monetapay) and whether the supplier delivered (uxiotopup). This enum owns
 * the second half alone, so the two can be read, filtered and reported on
 * separately.
 *
 * Three cases name situations `TransactionStatus` flattens today, and each one
 * an operator acts on differently:
 *
 * - REJECTED vs UNDELIVERED. `ProcessUxiotopupTopup::failed()` (retries exhausted,
 *   we never got a verdict) writes exactly the same FAILED_PROVIDER as an explicit
 *   `cancel` from the supplier. The right response is opposite: retry the first,
 *   refund the second.
 * - UNCONFIRMED. `SyncProcessingUxiotopupCommand` already alerts on this state and
 *   recognises it by guessing at `supplier_trx_id IS NULL`. Naming it replaces a
 *   heuristic with a fact, and lets the alert say which of the two happened: the
 *   worker died mid-call, or uxiotopup holds our order and we lost its id.
 *
 * Stored as a plain string with an enum cast, not a native DB enum — see the
 * migration for why.
 */
enum ProviderStatus: string
{
    /** No order placed, and for an EXPIRED payment there never will be. */
    case NOT_ORDERED = 'NOT_ORDERED';

    /** Paid; the fulfilment job is queued but nothing has been sent yet. */
    case QUEUED = 'QUEUED';

    /** The `/order` call is in flight, or between queue retries. */
    case SENDING = 'SENDING';

    /** uxiotopup accepted it; we hold `supplier_trx_id`, so it is pollable. */
    case ORDERED = 'ORDERED';

    /**
     * The order reached uxiotopup — it answered "idtrx sudah ada" — but we hold
     * no order id, and `/status` has no lookup by our own reference. Not pollable;
     * only the callback can finish it.
     */
    case UNCONFIRMED = 'UNCONFIRMED';

    /** Fulfilled, SN issued. */
    case DELIVERED = 'DELIVERED';

    /** The supplier explicitly answered cancel/refund. Not worth retrying. */
    case REJECTED = 'REJECTED';

    /** Retries exhausted with no verdict. Worth retrying. */
    case UNDELIVERED = 'UNDELIVERED';

    /** Outcomes where the supplier is finished with us, one way or the other. */
    public static function terminal(): array
    {
        return [self::DELIVERED, self::REJECTED, self::UNDELIVERED];
    }

    public function isTerminal(): bool
    {
        return in_array($this, self::terminal(), true);
    }

    /**
     * States where an order is out but we cannot poll for its result — the two
     * the reaper (`SyncProcessingUxiotopupCommand`) has to chase by hand.
     */
    public static function unpollable(): array
    {
        return [self::SENDING, self::UNCONFIRMED];
    }

    /**
     * The value for a row that predates this column, derived from what the old
     * schema recorded. Lives here rather than inline in the backfill migration so
     * the rule is unit-testable.
     *
     * Order matters: the `supplier_trx_id` / `supplier_status` refinements only
     * apply within a given `TransactionStatus`.
     *
     * `sn` is deliberately NOT read as evidence of success —
     * `ProcessUxiotopupTransactionAction` writes it from `keterangan` even on a
     * PROCESSING response.
     */
    public static function backfillFor(string $status, ?string $supplierTrxId, ?string $supplierStatus): self
    {
        $said = strtolower(trim((string) $supplierStatus));

        // uxiotopup's documented vocabulary is pending|processing|paid|success|
        // cancel|refund. The Indonesian words are legacy from the Digiflazz era
        // the column comment still mentions; accepting both costs nothing.
        $saidDelivered = in_array($said, ['success', 'sukses'], true);
        $saidRefused = in_array($said, ['cancel', 'refund', 'gagal', 'failed'], true);

        return match ($status) {
            TransactionStatus::PENDING->value, TransactionStatus::EXPIRED->value => self::NOT_ORDERED,

            TransactionStatus::PAID->value => self::QUEUED,

            // The duplicate-idtrx branch is the only way to reach "no trx id but
            // a supplier word": it writes supplier_status 'pending' and leaves
            // supplier_trx_id null.
            TransactionStatus::PROCESSING->value => match (true) {
                $supplierTrxId !== null && $supplierTrxId !== '' => self::ORDERED,
                $said !== '' => self::UNCONFIRMED,
                default => self::SENDING,
            },

            TransactionStatus::COMPLETED->value => self::DELIVERED,

            TransactionStatus::FAILED_PROVIDER->value => $saidRefused
                ? self::REJECTED
                : self::UNDELIVERED,

            // A refund only tells us money came back, never why. Recover the
            // supplier's own verdict where it was recorded.
            TransactionStatus::REFUNDED->value => match (true) {
                $saidDelivered => self::DELIVERED,
                $saidRefused => self::REJECTED,
                $supplierTrxId === null || $supplierTrxId === '' => self::NOT_ORDERED,
                default => self::UNDELIVERED,
            },

            default => self::NOT_ORDERED,
        };
    }
}

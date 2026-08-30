<?php

namespace Tests\Unit\Enums;

use App\Enums\ProviderStatus;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The rule that gives every pre-existing row the provider verdict it always had
 * but never recorded. It runs exactly once, against live data, so it gets tested
 * here rather than trusted inside a migration.
 */
class ProviderStatusBackfillTest extends TestCase
{
    public static function cases(): array
    {
        return [
            'never paid' => ['PENDING', null, null, ProviderStatus::NOT_ORDERED],
            'payment window closed' => ['EXPIRED', null, null, ProviderStatus::NOT_ORDERED],
            'paid, not yet sent' => ['PAID', null, null, ProviderStatus::QUEUED],

            'in flight, pollable' => ['PROCESSING', 'UX-1', 'pending', ProviderStatus::ORDERED],
            // The duplicate-idtrx branch is the only way to hold a supplier word
            // with no supplier id.
            'in flight, id lost' => ['PROCESSING', null, 'pending', ProviderStatus::UNCONFIRMED],
            'mid-call' => ['PROCESSING', null, null, ProviderStatus::SENDING],

            'fulfilled' => ['COMPLETED', 'UX-2', 'success', ProviderStatus::DELIVERED],

            'supplier said no' => ['FAILED_PROVIDER', 'UX-3', 'cancel', ProviderStatus::REJECTED],
            'supplier said refund' => ['FAILED_PROVIDER', 'UX-4', 'refund', ProviderStatus::REJECTED],
            // Legacy Indonesian wording from the Digiflazz era the column comment
            // still mentions.
            'supplier said gagal' => ['FAILED_PROVIDER', 'UX-5', 'Gagal', ProviderStatus::REJECTED],
            'no verdict, retries ran out' => ['FAILED_PROVIDER', 'UX-6', null, ProviderStatus::UNDELIVERED],

            // A refund records only that money came back. Recover the supplier's
            // verdict from wherever it was written.
            'refunded after delivery' => ['REFUNDED', 'UX-7', 'success', ProviderStatus::DELIVERED],
            'refunded after sukses' => ['REFUNDED', 'UX-8', 'Sukses', ProviderStatus::DELIVERED],
            'refunded after a cancel' => ['REFUNDED', 'UX-9', 'cancel', ProviderStatus::REJECTED],
            'refunded, never ordered' => ['REFUNDED', null, null, ProviderStatus::NOT_ORDERED],
            'refunded, no verdict' => ['REFUNDED', 'UX-10', 'processing', ProviderStatus::UNDELIVERED],
        ];
    }

    #[DataProvider('cases')]
    public function test_backfill_rule(
        string $status,
        ?string $supplierTrxId,
        ?string $supplierStatus,
        ProviderStatus $expected,
    ): void {
        $this->assertSame(
            $expected,
            ProviderStatus::backfillFor($status, $supplierTrxId, $supplierStatus),
        );
    }

    public function test_an_empty_supplier_trx_id_counts_as_absent(): void
    {
        // Older rows store '' rather than NULL; treating that as "we have an id"
        // would mark an unpollable order pollable and hide it from the reaper.
        $this->assertSame(
            ProviderStatus::SENDING,
            ProviderStatus::backfillFor('PROCESSING', '', null),
        );
    }
}

<?php

namespace Tests\Feature\Transaction;

use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Support\Transaction\ProviderStatusPolicy;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The safety net under a second status column.
 *
 * `transactions.status` and `transactions.provider_status` describe overlapping
 * facts, and roughly a dozen places write the first. If maintaining the second
 * were a convention, it would hold right up until the thirteenth writer. These
 * tests pin the two properties that make it structural instead: a caller that
 * says nothing about the provider still gets a correct value, and a caller that
 * says something impossible is refused.
 */
class ProviderStatusInvariantTest extends TestCase
{
    use RefreshDatabase;

    public static function statusProvider(): array
    {
        return collect(TransactionStatus::cases())
            ->mapWithKeys(fn (TransactionStatus $s) => [$s->value => [$s]])
            ->all();
    }

    /**
     * Every status, written on its own, lands on the policy's default. This is
     * what every untouched write point in the codebase relies on.
     */
    #[DataProvider('statusProvider')]
    public function test_status_alone_fills_the_provider_column(TransactionStatus $status): void
    {
        // REFUNDED preserves rather than defaults, so it is covered separately.
        if (ProviderStatusPolicy::keepsPreviousOn($status)) {
            $this->markTestSkipped('REFUNDED preserves; see the preservation test.');
        }

        $transaction = Transaction::factory()->create(['status' => $status]);

        $this->assertSame(
            ProviderStatusPolicy::defaultFor($status),
            $transaction->fresh()->provider_status,
            "status {$status->value} did not default correctly",
        );
    }

    #[DataProvider('statusProvider')]
    public function test_every_default_is_itself_allowed(TransactionStatus $status): void
    {
        $default = ProviderStatusPolicy::defaultFor($status);

        if ($default === null) {
            $this->assertTrue(ProviderStatusPolicy::keepsPreviousOn($status));

            return;
        }

        $this->assertTrue(
            ProviderStatusPolicy::allows($status, $default),
            "default for {$status->value} is not in its own allowed set",
        );
    }

    public function test_an_explicit_compatible_value_is_kept(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PAID]);

        $transaction->update([
            'status' => TransactionStatus::PROCESSING,
            'provider_status' => ProviderStatus::ORDERED,
        ]);

        // Not overwritten with the PROCESSING default (SENDING) — the caller knew
        // the supplier had accepted the order.
        $this->assertSame(ProviderStatus::ORDERED, $transaction->fresh()->provider_status);
    }

    public function test_an_impossible_pair_is_refused(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PENDING]);

        $this->expectException(DomainException::class);

        // Nothing has been ordered while the customer has not paid.
        $transaction->update([
            'status' => TransactionStatus::PENDING,
            'provider_status' => ProviderStatus::DELIVERED,
        ]);
    }

    public function test_a_provider_only_write_is_validated_against_the_current_status(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::COMPLETED]);

        $this->expectException(DomainException::class);

        $transaction->update(['provider_status' => ProviderStatus::NOT_ORDERED]);
    }

    /**
     * The rule that earns the column: a refund records that money came back, not
     * whether the supplier delivered. Losing that is why a derived value could
     * never replace this column.
     */
    public function test_refunding_preserves_every_provider_outcome(): void
    {
        foreach (ProviderStatus::cases() as $provider) {
            $transaction = Transaction::factory()->create([
                'status' => TransactionStatus::FAILED_PROVIDER,
                'provider_status' => ProviderStatus::REJECTED,
            ]);

            // Force the row to the outcome under test without tripping the matrix.
            Transaction::withoutEvents(fn () => $transaction->update(['provider_status' => $provider]));

            $transaction->refresh()->update(['status' => TransactionStatus::REFUNDED]);

            $this->assertSame(
                $provider,
                $transaction->fresh()->provider_status,
                "refunding erased the provider outcome {$provider->value}",
            );
        }
    }

    /**
     * The matrix must cover the enum exhaustively — a status with no entry would
     * make the guard silently permissive for that state.
     */
    #[DataProvider('statusProvider')]
    public function test_every_status_has_a_non_empty_allowed_set(TransactionStatus $status): void
    {
        $this->assertNotEmpty(ProviderStatusPolicy::allowedFor($status));
    }
}

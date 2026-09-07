<?php

namespace Tests\Unit;

use App\Support\Activity\ActivityTypeClassifier;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ActivityTypeClassifierTest extends TestCase
{
    public function test_a_stored_type_always_wins(): void
    {
        $this->assertSame('security', ActivityTypeClassifier::classify('security', null, 'Anything at all'));
    }

    #[DataProvider('messages')]
    public function test_it_derives_a_category_from_the_message(string $message, ?int $transactionId, ?string $expected): void
    {
        $this->assertSame($expected, ActivityTypeClassifier::classify(null, $transactionId, $message));
    }

    public static function messages(): array
    {
        return [
            'login' => ['User logged in successfully', null, 'login'],
            'google login' => ['User logged in with Google', null, 'login'],
            'transaction by INV' => ['Admin created Transaction: INV-20260819-0001', null, 'transaction'],
            'transaction by link' => ['Some note', 42, 'transaction'],
            'topup' => ['Membuka isi saldo Rp 50000 via BCA', null, 'transaction'],
            'data crud' => ['Created new Product: Mobile Legends', null, 'data'],
            'data delete' => ['Deleted Supplier: Uxiolabs', null, 'data'],
            'security' => ['Password reset completed', null, 'security'],
            'unknown' => ['Something entirely unclassifiable zzz', null, null],
        ];
    }
}

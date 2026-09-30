<?php

declare(strict_types=1);

namespace Tests\Feature\Contracts;

use App\Contracts\RefundClaimChannel;
use App\Contracts\RefundCompletedChannel;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Both refund seams, asserted — not the channels behind them.
 *
 * Same shape as ReceiptChannelTest: a bad entry in either config list means a
 * customer is never told their money is waiting, or never told it was sent.
 */
class RefundChannelTest extends TestCase
{
    public static function seamProvider(): array
    {
        return [
            'claim' => ['notifications.refund_claim', RefundClaimChannel::class],
            'completed' => ['notifications.refund_completed', RefundCompletedChannel::class],
        ];
    }

    #[DataProvider('seamProvider')]
    public function test_every_configured_channel_conforms(string $configKey, string $contract): void
    {
        $channels = (array) config($configKey);

        $this->assertNotSame([], $channels, "{$configKey} harus memuat setidaknya satu kanal.");

        foreach ($channels as $class) {
            $this->assertTrue(class_exists($class), "Kanal [{$class}] tidak ditemukan.");
            $this->assertTrue(
                is_subclass_of($class, $contract),
                "Kanal [{$class}] wajib mengimplementasikan {$contract}."
            );
        }
    }
}

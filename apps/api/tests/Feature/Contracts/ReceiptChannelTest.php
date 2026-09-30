<?php

declare(strict_types=1);

namespace Tests\Feature\Contracts;

use App\Contracts\ReceiptChannel;
use App\Support\Integration\AdapterResolver;
use InvalidArgumentException;
use stdClass;
use Tests\TestCase;

/**
 * The receipt seam itself, asserted — not the channels behind it.
 *
 * What must hold is that every channel named in `config/notifications.receipt`
 * exists and conforms, because a bad entry there means a customer is not told
 * their order completed. Checked by reflection, so this test needs no database.
 */
class ReceiptChannelTest extends TestCase
{
    public function test_every_configured_receipt_channel_conforms(): void
    {
        $channels = (array) config('notifications.receipt');

        $this->assertNotSame([], $channels, 'Setidaknya satu kanal receipt harus terdaftar.');

        foreach ($channels as $class) {
            $this->assertTrue(class_exists($class), "Kanal [{$class}] tidak ditemukan.");
            $this->assertTrue(
                is_subclass_of($class, ReceiptChannel::class),
                "Kanal [{$class}] wajib mengimplementasikan ".ReceiptChannel::class.'.'
            );
        }
    }

    public function test_a_channel_that_does_not_conform_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        AdapterResolver::resolveAll(ReceiptChannel::class, [stdClass::class]);
    }
}

<?php

namespace Tests\Unit\Support;

use App\Support\Money;
use Tests\TestCase;

class MoneyTest extends TestCase
{
    public function test_it_uses_indonesian_separators(): void
    {
        // The bug this replaces: bare number_format() gave "Rp 1,500,000" in
        // an error message while the invoice PDF for the same transaction
        // said "Rp 1.500.000".
        $this->assertSame('Rp 1.500.000', Money::rupiah(1500000));
        $this->assertSame('Rp 0', Money::rupiah(0));
        $this->assertSame('Rp 999', Money::rupiah(999));
    }

    public function test_it_never_shows_decimals(): void
    {
        // Money is integer rupiah throughout; a float only ever arrives from a
        // computed average and must not print cents.
        $this->assertSame('Rp 12.345', Money::rupiah(12345.67));
    }

    public function test_digits_omits_the_label_for_callers_that_write_their_own(): void
    {
        $this->assertSame('1.500.000', Money::digits(1500000));
    }
}

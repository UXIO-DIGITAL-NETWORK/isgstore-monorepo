<?php

namespace Tests\Unit;

use App\Support\Storefront\GuestName;
use PHPUnit\Framework\TestCase;

class GuestNameTest extends TestCase
{
    public function test_it_generates_a_letter_first_five_digit_pseudonym(): void
    {
        // Random output — assert the shape holds across many draws, not one lucky one.
        for ($i = 0; $i < 200; $i++) {
            $this->assertMatchesRegularExpression('/^Guest [A-Z]\d{5}$/', GuestName::generate());
        }
    }
}

<?php

namespace Tests\Unit\Support\Auth;

use App\Support\Auth\Base32;
use Tests\TestCase;

class Base32Test extends TestCase
{
    public function test_it_round_trips(): void
    {
        foreach (['', 'a', 'ab', 'abc', 'abcd', 'abcde', '12345678901234567890'] as $raw) {
            $this->assertSame($raw, Base32::decode(Base32::encode($raw)), "round trip failed for '{$raw}'");
        }
    }

    public function test_it_matches_the_rfc_4648_vectors(): void
    {
        $this->assertSame('MY', Base32::encode('f'));
        $this->assertSame('MZXQ', Base32::encode('fo'));
        $this->assertSame('MZXW6', Base32::encode('foo'));
        $this->assertSame('MZXW6YQ', Base32::encode('foob'));
        $this->assertSame('MZXW6YTB', Base32::encode('fooba'));
        $this->assertSame('MZXW6YTBOI', Base32::encode('foobar'));
    }

    public function test_it_forgives_how_a_human_retypes_a_secret(): void
    {
        // Somebody typing the key into their authenticator by hand introduces
        // spaces, and some apps lowercase it. Padding is optional because
        // Google Authenticator omits it.
        $this->assertSame('foobar', Base32::decode('MZXW6YTBOI'));
        $this->assertSame('foobar', Base32::decode('mzxw6ytboi'));
        $this->assertSame('foobar', Base32::decode('MZXW 6YTB OI'));
        $this->assertSame('foobar', Base32::decode('MZXW6YTBOI======'));
    }

    public function test_it_rejects_input_that_is_not_base32(): void
    {
        $this->assertSame('', Base32::decode('not base32!'));
        $this->assertSame('', Base32::decode('0189'));
    }

    public function test_a_generated_secret_is_the_recommended_length(): void
    {
        // 20 bytes → 32 base32 characters, the RFC 4226 recommendation.
        $this->assertSame(32, strlen(Base32::randomSecret()));
        $this->assertSame(20, strlen(Base32::decode(Base32::randomSecret())));
    }
}

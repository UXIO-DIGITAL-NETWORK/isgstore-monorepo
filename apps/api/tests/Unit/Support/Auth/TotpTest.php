<?php

namespace Tests\Unit\Support\Auth;

use App\Support\Auth\Base32;
use App\Support\Auth\Totp;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The RFC 6238 Appendix B vectors. If these pass, the implementation is
 * correct — everything else in the 2FA feature is plumbing around them.
 */
class TotpTest extends TestCase
{
    /** The RFC's SHA-1 seed, base32-encoded the way an authenticator holds it. */
    private function rfcSecret(): string
    {
        return Base32::encode('12345678901234567890');
    }

    /** @return array<string, array{int, string}> */
    public static function rfcVectors(): array
    {
        return [
            'T=59' => [59, '94287082'],
            'T=1111111109' => [1111111109, '07081804'],
            'T=1111111111' => [1111111111, '14050471'],
            'T=1234567890' => [1234567890, '89005924'],
            'T=2000000000' => [2000000000, '69279037'],
            'T=20000000000' => [20000000000, '65353130'],
        ];
    }

    #[DataProvider('rfcVectors')]
    public function test_it_matches_the_rfc_6238_vectors(int $time, string $expectedEightDigits): void
    {
        // The RFC publishes 8-digit codes; authenticators show the last 6.
        $expected = substr($expectedEightDigits, -Totp::DIGITS);

        $this->assertSame($expected, Totp::at($this->rfcSecret(), Totp::timestep($time)));
    }

    public function test_it_accepts_a_code_from_one_step_either_side(): void
    {
        // Phone clocks drift; a ±1 window is the standard allowance.
        $secret = Base32::randomSecret();
        $now = time();

        foreach ([-1, 0, 1] as $offset) {
            $code = Totp::at($secret, Totp::timestep($now) + $offset);
            $this->assertNotNull(Totp::verify($secret, $code, null, $now), "offset {$offset} must verify");
        }

        $stale = Totp::at($secret, Totp::timestep($now) - 2);
        $this->assertNull(Totp::verify($secret, $stale, null, $now), 'Two steps back is too old.');
    }

    public function test_a_spent_timestep_cannot_be_replayed(): void
    {
        // The realistic attack is a phishing proxy relaying a code the victim
        // just typed. Without this, the ±1 window leaves it valid ~90 seconds.
        $secret = Base32::randomSecret();
        $now = time();
        $code = Totp::at($secret, Totp::timestep($now));

        $step = Totp::verify($secret, $code, null, $now);
        $this->assertNotNull($step);

        $this->assertNull(Totp::verify($secret, $code, $step, $now), 'A used code must not verify twice.');
    }

    public function test_it_rejects_malformed_input(): void
    {
        $secret = Base32::randomSecret();

        $this->assertNull(Totp::verify($secret, ''));
        $this->assertNull(Totp::verify($secret, '12345'));
        $this->assertNull(Totp::verify($secret, 'abcdef'));
        $this->assertNull(Totp::verify('not-base32!', '123456'));
    }

    public function test_the_provisioning_uri_carries_what_an_app_needs(): void
    {
        $uri = Totp::provisioningUri('JBSWY3DPEHPK3PXP', 'admin@uxiotopup.id', 'UXIOLABS');

        $this->assertStringStartsWith('otpauth://totp/', $uri);
        $this->assertStringContainsString('secret=JBSWY3DPEHPK3PXP', $uri);
        $this->assertStringContainsString('issuer=UXIOLABS', $uri);
        $this->assertStringContainsString('digits=6', $uri);
    }
}

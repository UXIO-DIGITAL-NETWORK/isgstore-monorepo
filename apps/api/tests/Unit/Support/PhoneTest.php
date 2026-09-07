<?php

namespace Tests\Unit\Support;

use App\Support\Phone;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * `Phone` decides two things nothing else can recover from: what a number is
 * stored as, and which stored spellings count as the same person. The second is
 * the load-bearing one — it is how a customer finds their own order and how a
 * refund is matched to the account claiming it — and it had no direct test.
 */
class PhoneTest extends TestCase
{
    // ── Canonical form ──────────────────────────────────────────────────────

    #[DataProvider('e164Cases')]
    public function test_to_e164(?string $raw, ?string $expected): void
    {
        $this->assertSame($expected, Phone::toE164($raw));
    }

    public static function e164Cases(): array
    {
        return [
            'trunk zero becomes the default country' => ['081234567890', '+6281234567890'],
            'country code already present' => ['6281234567890', '+6281234567890'],
            'formatting is ignored' => ['+62 812-3456-7890', '+6281234567890'],
            'international call prefix' => ['006281234567890', '+6281234567890'],
            // The point of the change: a foreign country code survives.
            'foreign number is kept' => ['+6591234567', '+6591234567'],
            'foreign via 00 prefix' => ['0065 9123 4567', '+6591234567'],
            'foreign with formatting' => ['+1 (415) 555-0132', '+14155550132'],
            'too short' => ['123', null],
            'too long for e164' => ['+621234567890123456', null],
            'no digits at all' => ['+', null],
            'empty' => ['', null],
            'whitespace only' => ['   ', null],
            'null' => [null, null],
        ];
    }

    public function test_a_canonical_number_never_starts_with_a_zero(): void
    {
        // The user-facing requirement, asserted structurally rather than by
        // example: an E.164 country code cannot begin with 0, so no input can
        // produce one.
        foreach (['081234567890', '00081234567890', '+62 0812 3456', '6281234567890'] as $raw) {
            $result = Phone::toE164($raw);

            if ($result !== null) {
                $this->assertStringStartsWith('+', $result);
                $this->assertStringNotContainsString('+0', $result);
            }
        }

        $this->assertTrue(true);
    }

    public function test_the_default_country_is_configurable(): void
    {
        // Nothing in the codebase changes this today, but the assumption is now
        // a setting rather than a constant — that is what makes another
        // deployment possible without editing the helper.
        $this->assertSame('+6591234567', Phone::toE164('091234567', '65'));
    }

    // ── Spelling set ────────────────────────────────────────────────────────

    public function test_candidates_cover_both_local_spellings_of_a_default_country_number(): void
    {
        // Legacy rows were never migrated, so all of these exist in the same
        // column and must resolve to one another.
        $fromInternational = Phone::candidates('6281234567890');
        $this->assertContains('081234567890', $fromInternational);
        $this->assertContains('6281234567890', $fromInternational);
        $this->assertContains('+6281234567890', $fromInternational);

        $fromNational = Phone::candidates('081234567890');
        $this->assertContains('6281234567890', $fromNational);
        $this->assertContains('+6281234567890', $fromNational);

        // A plus marks a country code, and no country code starts with zero —
        // "+0812…" can match nothing and would only widen the lookup.
        $this->assertNotContains('+081234567890', $fromNational);
    }

    public function test_candidates_for_a_foreign_number_invent_no_local_spelling(): void
    {
        // A "0…" form of a Singaporean number was never written here, and
        // generating one would only widen the match surface.
        $candidates = Phone::candidates('+6591234567');

        $this->assertContains('6591234567', $candidates);
        $this->assertContains('+6591234567', $candidates);
        $this->assertNotContains('091234567', $candidates);
    }

    public function test_candidates_refuse_anything_too_short_to_be_a_number(): void
    {
        // The floor is what stops a short prefix from being cheap to iterate;
        // callers read [] as "skip the phone branch entirely".
        $this->assertSame([], Phone::candidates('6281'));
        $this->assertSame([], Phone::candidates('123'));
        $this->assertSame([], Phone::candidates(''));
    }

    public function test_candidates_never_contain_a_partial_number(): void
    {
        // TrackOrdersAction matches these exactly; a prefix leaking into the set
        // would silently turn its lookup into a walkable search.
        $this->assertNotContains('6281234', Phone::candidates('6281234567890'));
    }

    // ── Indonesian-only consumers ───────────────────────────────────────────

    public function test_indonesian_local_form(): void
    {
        $this->assertSame('081234567890', Phone::toIndonesianLocal('+6281234567890'));
        $this->assertSame('081234567890', Phone::toIndonesianLocal('081234567890'));
    }

    public function test_indonesian_local_refuses_a_foreign_number(): void
    {
        // Monetapay disburses to Indonesian e-wallets, where the phone IS the
        // beneficiary. Returning null makes the caller fall back rather than
        // send money toward a number that will be rejected.
        $this->assertNull(Phone::toIndonesianLocal('+6591234567'));
        $this->assertNull(Phone::toIndonesianLocal('+14155550132'));
        $this->assertNull(Phone::toIndonesianLocal(null));
        $this->assertNull(Phone::toIndonesianLocal('123'));
    }
}

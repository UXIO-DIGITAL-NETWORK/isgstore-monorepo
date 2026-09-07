<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The storefront footer and navbar read their branding and support contact
 * from the public settings endpoint, so the keys they depend on must both
 * exist after seeding and come back on that endpoint — a missing key is a
 * silently blank footer, which no other test would catch.
 */
class StorefrontFooterSettingsTest extends TestCase
{
    use RefreshDatabase;

    /** Keys the footer/navbar render, every one of them public. */
    private const FOOTER_KEYS = [
        'site_name',
        'logo',
        'footer_description',
        'copyright_text',
        'contact_email',
        'contact_whatsapp',
        'operational_hours',
        'social_instagram',
        'social_tiktok',
        'social_youtube',
        'social_facebook',
        'social_x',
        'social_linkedin',
    ];

    public function test_seeder_creates_every_key_the_storefront_footer_reads(): void
    {
        $this->seed(SettingSeeder::class);

        foreach (self::FOOTER_KEYS as $key) {
            $this->assertTrue(
                Setting::where('key', $key)->where('is_public', true)->exists(),
                "Setting [$key] must exist and be public for the storefront footer.",
            );
        }
    }

    public function test_public_settings_endpoint_returns_the_footer_keys(): void
    {
        $this->seed(SettingSeeder::class);

        $payload = $this->getJson('/api/v1/storefront/settings')
            ->assertOk()
            ->json('data');

        foreach (self::FOOTER_KEYS as $key) {
            $this->assertArrayHasKey($key, $payload);
        }
    }

    /**
     * A key an admin has left blank still has to be returned — the storefront
     * distinguishes "not configured" (fall back to the bundled copy) from
     * "network not used" (hide the icon), and it can only do that if the key
     * is present with a null value.
     */
    public function test_blank_optional_settings_are_returned_as_null(): void
    {
        $this->seed(SettingSeeder::class);

        $payload = $this->getJson('/api/v1/storefront/settings')->json('data');

        $this->assertNull($payload['social_x']);
        $this->assertNull($payload['copyright_text']);
    }

    public function test_seeder_does_not_overwrite_an_admin_edit(): void
    {
        $this->seed(SettingSeeder::class);

        Setting::where('key', 'operational_hours')->update(['value' => 'Senin–Jumat, 09.00–17.00']);

        $this->seed(SettingSeeder::class);

        $this->assertSame('Senin–Jumat, 09.00–17.00', Setting::where('key', 'operational_hours')->value('value'));
    }
}

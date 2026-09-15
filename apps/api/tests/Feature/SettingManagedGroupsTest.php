<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Groups the settings form does not own.
 *
 * `licence` is rewritten by the Hub every five minutes and decides whether the
 * storefront answers at all; `pricing` is configured per membership plan on the
 * Pricing Rules screen. Both used to be ordinary editable rows here, so an
 * admin could switch the licence off — and be silently overruled five minutes
 * later, having closed the storefront in the meantime.
 */
class SettingManagedGroupsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function setting(string $group, string $key, string $value, string $type = 'string'): Setting
    {
        return Setting::create([
            'group' => $group,
            'key' => $key,
            'value' => $value,
            'type' => $type,
            'label' => $key,
            'is_public' => false,
        ]);
    }

    public function test_the_settings_list_leaves_managed_groups_out(): void
    {
        $this->setting('general', 'site_name', 'ISG Store');
        $this->setting('licence', 'is_serving', '0', 'boolean');
        $this->setting('pricing', 'default_markup_percent', '20', 'number');

        $keys = collect($this->getJson('/api/v1/settings')->assertOk()->json('data'))->pluck('key');

        $this->assertTrue($keys->contains('site_name'));
        $this->assertFalse($keys->contains('is_serving'));
        $this->assertFalse($keys->contains('default_markup_percent'));
    }

    public function test_the_licence_cannot_be_written_through_the_settings_form(): void
    {
        $this->setting('licence', 'is_serving', '0', 'boolean');
        $this->setting('licence', 'status', 'suspended');

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'is_serving' => '1',
                'status' => 'active',
            ],
        ])->assertOk();

        // The Hub's answer has to survive. A local edit would be reverted on the
        // next sync anyway, and until then the site would be serving without the
        // Hub's consent — which is the one thing this state exists to prevent.
        $this->assertSame('0', Setting::where('key', 'is_serving')->value('value'));
        $this->assertSame('suspended', Setting::where('key', 'status')->value('value'));
    }

    public function test_the_default_markup_cannot_be_written_through_the_settings_form(): void
    {
        $this->setting('pricing', 'default_markup_percent', '20', 'number');

        $this->putJson('/api/v1/settings', ['settings' => ['default_markup_percent' => '95']])->assertOk();

        $this->assertSame('20', Setting::where('key', 'default_markup_percent')->value('value'));
    }

    public function test_an_ordinary_setting_is_still_written(): void
    {
        // The guard must not have taken the endpoint down with it, and the two
        // kinds of key travel in the same request.
        $this->setting('general', 'site_name', 'ISG Store');
        $this->setting('licence', 'is_serving', '0', 'boolean');

        $this->putJson('/api/v1/settings', [
            'settings' => ['site_name' => 'ISG Baru', 'is_serving' => '1'],
        ])->assertOk();

        $this->assertSame('ISG Baru', Setting::where('key', 'site_name')->value('value'));
        $this->assertSame('0', Setting::where('key', 'is_serving')->value('value'));
    }

    public function test_a_refused_key_is_not_reported_as_updated(): void
    {
        $this->setting('licence', 'is_serving', '0', 'boolean');

        $this->putJson('/api/v1/settings', ['settings' => ['is_serving' => '1']])->assertOk();

        // The activity log names the keys that were written, so a refused one
        // must not appear: the trail would otherwise record a change to the
        // licence that never happened, which is the whole point of having it.
        $this->assertSame(
            0,
            ActivityLog::where('message', 'like', '%is_serving%')->count(),
            'A refused key must not reach the activity log.',
        );
    }
}

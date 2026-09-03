<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The storefront footer and navbar rendered their branding, support contact and
 * copy from bundled constants, so changing a support e-mail or a social link
 * meant a front-end deploy. These keys move that copy behind the existing
 * settings surface the admin already edits.
 *
 * A settings key only exists if a migration or seeder created it —
 * `SettingController@update` deliberately ignores unknown keys — so an
 * environment that never re-runs seeders needs the rows inserted here.
 */
return new class extends Migration
{
    /** group, key, value, type, label, is_public */
    private const SETTINGS = [
        [
            'general',
            'footer_description',
            'Platform top up game yang menyediakan layanan cepat, aman, dan praktis untuk berbagai kebutuhan digital Anda.',
            'text',
            'Footer Description',
            true,
        ],
        ['general', 'copyright_text', null, 'text', 'Copyright Text', true],
        ['contact', 'operational_hours', '24 Jam', 'string', 'Operational Hours', true],
        ['social', 'social_x', null, 'string', 'X (Twitter)', true],
        ['social', 'social_linkedin', null, 'string', 'LinkedIn', true],
    ];

    public function up(): void
    {
        foreach (self::SETTINGS as [$group, $key, $value, $type, $label, $isPublic]) {
            // insertOrIgnore rather than upsert: on a re-run an admin's edited
            // value must survive, and the unique index on `key` is the guard.
            DB::table('settings')->insertOrIgnore([
                'group' => $group,
                'key' => $key,
                'value' => $value,
                'type' => $type,
                'label' => $label,
                'is_public' => $isPublic,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')
            ->whereIn('key', array_column(self::SETTINGS, 1))
            ->delete();
    }
};

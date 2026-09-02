<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Site settings the storefront and admin both read.
 *
 * `is_public` is set deliberately per key — only what the storefront needs is
 * exposed on the public endpoint. Anything operational stays admin-only.
 */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // group, key, value, type, label, is_public
            ['general', 'site_name', 'TopUpGame.ID', 'string', 'Site Name', true],
            ['general', 'site_tagline', 'Top Up Game Termurah & Tercepat', 'string', 'Tagline', true],
            ['general', 'logo', null, 'image', 'Logo', true],
            ['general', 'favicon', null, 'image', 'Favicon', true],
            ['general', 'maintenance_mode', '0', 'boolean', 'Maintenance Mode', true],

            ['contact', 'contact_whatsapp', '6281234567890', 'string', 'WhatsApp', true],
            ['contact', 'contact_email', 'support@topupgame.id', 'string', 'Support Email', true],
            ['contact', 'contact_address', 'Jakarta, Indonesia', 'string', 'Address', true],

            ['social', 'social_instagram', 'https://instagram.com/topupgame.id', 'string', 'Instagram', true],
            ['social', 'social_tiktok', 'https://tiktok.com/@topupgame.id', 'string', 'TikTok', true],
            ['social', 'social_youtube', 'https://youtube.com/@topupgameid', 'string', 'YouTube', true],
            ['social', 'social_facebook', 'https://facebook.com/topupgameid', 'string', 'Facebook', true],

            ['seo', 'meta_title', 'TopUpGame.ID — Top Up Game Murah, Cepat, Aman', 'string', 'Meta Title', true],
            [
                'seo',
                'meta_description',
                'Top up diamond, UC, dan voucher game favoritmu dengan harga termurah. Proses otomatis 24 jam.',
                'text',
                'Meta Description',
                true,
            ],
            ['seo', 'og_image', null, 'image', 'OG Image', true],

            // Presets for the member wallet top-up form.
            ['payment', 'balance_topup_presets', '[10000,25000,50000,100000,250000,500000]', 'json', 'Top-up Nominal Presets', true],
            ['payment', 'min_topup_amount', '10000', 'number', 'Minimum Top-up', true],

            // Loyalty points. `earn_percent`/`earn_flat` are the fallback for a
            // product that has none of its own, so a new SKU still earns.
            // `redeem_rate` is what one point is worth in rupiah when spent.
            ['points', 'earn_percent', '1', 'number', 'Point Earn (%)', true],
            ['points', 'earn_flat', '0', 'number', 'Point Earn (flat)', true],
            ['points', 'redeem_rate', '1', 'number', 'Point Value (Rp)', true],

            // The markup applied when no pricing rule matches at any level.
            // A single figure, because there is no sensible built-in default
            // for a membership plan an admin invented this morning.
            ['pricing', 'default_markup_percent', '20', 'number', 'Default Markup (%)', false],

            // Operational — never exposed publicly.
            ['operational', 'order_auto_expire_minutes', '15', 'number', 'Order Expiry (minutes)', false],
            ['operational', 'support_notification_email', 'ops@topupgame.id', 'string', 'Ops Notification Email', false],
        ];

        foreach ($settings as [$group, $key, $value, $type, $label, $isPublic]) {
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'group' => $group,
                    // updateOrCreate would otherwise overwrite an admin's edit
                    // every time the seeder runs; only the metadata is refreshed.
                    'value' => Setting::where('key', $key)->value('value') ?? $value,
                    'type' => $type,
                    'label' => $label,
                    'is_public' => $isPublic,
                ],
            );
        }
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Ten seeded banners that could never render.
 *
 * `BannerSeeder` inserted rows whose `image_path` pointed at `/banners/*.jpg` —
 * files this repository has never shipped, so `Support\Storefront\MediaUrl`
 * resolved every one of them to null and the public feed dropped them. The
 * links were no better: they led to `uxio.id`, another brand's domain.
 *
 * The effect was an empty hero feed that looked exactly like a storefront
 * ignoring the API, with nothing logged anywhere. The rows are removed rather
 * than repaired because there is nothing to repair them with: no image exists
 * to attach, and the operator's own uploads are the real content.
 *
 * Matched on the leading slash, which is what makes them unambiguous — the
 * admin uploader stores under `banners/images/...`, never `/banners/...`.
 */
return new class extends Migration
{
    /** @var list<string> */
    private const SEEDED_PATHS = [
        '/banners/ramadan-2026.jpg',
        '/banners/flash-sale.jpg',
        '/banners/referral.jpg',
        '/banners/mlbb-skin.jpg',
        '/banners/ff-ob48.jpg',
        '/banners/val-champs.jpg',
        '/banners/genshin-50.jpg',
        '/banners/pubg-db.jpg',
        '/banners/hut-ri.jpg',
        '/banners/cashback-ewallet.jpg',
    ];

    public function up(): void
    {
        DB::table('banners')->whereIn('image_path', self::SEEDED_PATHS)->delete();
    }

    public function down(): void
    {
        // Not restored: the rows pointed at files that do not exist, so putting
        // them back would re-create ten banners that can never be shown.
    }
};

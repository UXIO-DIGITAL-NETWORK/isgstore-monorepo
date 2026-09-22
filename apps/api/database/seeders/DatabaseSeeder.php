<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database — a starter install, NOT a demo install.
     *
     * The catalogue is deliberately empty: no games, no products, no supplier
     * mappings. Those are the operator's own inventory and arrive through
     * `uxiolabs:sync-products` → Set Margin → Promote → Publish, or the admin's
     * Add Product form. Seeding a sample game meant every fresh install started
     * with someone else's Mobile Legends SKUs to delete first.
     *
     * What is seeded is only what the app cannot start without, or what is
     * configuration rather than inventory: roles, three known logins, payment
     * channels, pricing rules, the Uxiolabs supplier, category types, plus the
     * static pages and site settings.
     *
     * The catalogue seeders (Category, SubCategory, ServerCategory,
     * ServerCategoryOption, OrderFormSchema, Product, SupplierCategory,
     * SupplierProduct) still exist and still work — they are simply not called.
     * `ProductSeeder::services()` in particular is a useful reference for the
     * shape of a uxiolabs SKU.
     *
     * Order still follows the foreign keys:
     * 1. Foundation (roles, category types, suppliers, payment channels, pricing)
     * 2. Users (depends on roles)
     * 3. Static pages + settings
     */
    public function run(): void
    {
        $this->call([
            // === 1. Foundation Master Data ===
            RoleSeeder::class,
            CategoryTypeSeeder::class,
            SupplierSeeder::class,
            PaymentChannelSeeder::class,
            // Plans before rules: pricing rules are keyed on a membership plan
            // now, so a rule seeded first would have nothing to point at.
            MembershipPlanSeeder::class,
            PricingRuleSeeder::class,

            // === 2. Users ===
            UserSeeder::class,
            // System account for Hub-driven money-path actions (approved_by).
            HubSystemUserSeeder::class,

            // === 3. Catalogue — intentionally NOT seeded ===
            // CategorySeeder, SubCategorySeeder, ServerCategorySeeder,
            // ServerCategoryOptionSeeder, OrderFormSchemaSeeder,
            // ProductSeeder, SupplierCategorySeeder, SupplierProductSeeder.
            // See the class docblock: inventory belongs to the operator.

            // Guarantees the one supplier row two uxiolabs actions resolve with
            // firstOrFail. Runs on its own now that no catalogue precedes it.
            MasterDataSeeder::class,

            // === 4. Transactions — never seeded ===
            // OrderSeeder::class, // Table renamed to transactions
            // PaymentSeeder::class,

            // === 5. Auxiliary (depends on Orders) ===
            // PointHistorySeeder::class,
            // RatingSeeder::class,
            // UserSpendingSeeder::class,
            // ActivityLogSeeder::class,

            // === 6. CMS Content ===
            // Only the STATIC pages and the site's own settings are seeded.
            // Promos, flash sales and the editorial content — announcements,
            // articles and their categories, FAQ, testimonials — are the
            // operator's own listing, not the app's: a fresh install shows those
            // admin pages EMPTY. Their seeders used to ship sample rows
            // (HEMAT10, "Flash Sale Mingguan", Admin_Topupgame's articles) that
            // every install had to delete before publishing anything real.
            //
            // § The static pages stay: they carry backing copy the storefront
            // links to (privacy policy, terms, refund policy).
            //
            // § No BannerSeeder either: it seeded ten rows whose image files this
            // repository never shipped, so the storefront's feed dropped every
            // one of them. Hero artwork is the operator's to upload.
            PageSeeder::class,
            SettingSeeder::class,

            // § Payment-page services are deliberately NOT seeded either. The
            // Hub owns that catalogue now: `hub:sync-catalog`
            // (SyncCatalogFromHubAction) mirrors it down, matched on `code`, and
            // the payment page reads whatever the mirror holds. Seeding a copy
            // here would show a client services their Hub had never published,
            // and would come back on every fresh install. ServiceSeeder still
            // exists and still works — it is simply not called.
        ]);
    }
}

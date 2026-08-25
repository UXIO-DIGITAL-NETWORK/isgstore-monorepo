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
     * `uxiotopup:sync-products` → Set Margin → Promote → Publish, or the admin's
     * Add Product form. Seeding a sample game meant every fresh install started
     * with someone else's Mobile Legends SKUs to delete first.
     *
     * What is seeded is only what the app cannot start without, or what is
     * configuration rather than inventory: roles, three known logins, payment
     * channels, pricing rules, the Uxiotopup supplier, category types, plus CMS
     * content and the plans/services catalogues.
     *
     * The catalogue seeders (Category, SubCategory, ServerCategory,
     * ServerCategoryOption, OrderFormSchema, Product, SupplierCategory,
     * SupplierProduct) still exist and still work — they are simply not called.
     * `ProductSeeder::services()` in particular is a useful reference for the
     * shape of a uxiotopup SKU.
     *
     * Order still follows the foreign keys:
     * 1. Foundation (roles, category types, suppliers, payment channels, pricing)
     * 2. Users (depends on roles)
     * 3. CMS content, plans, services
     */
    public function run(): void
    {
        $this->call([
            // === 1. Foundation Master Data ===
            RoleSeeder::class,
            CategoryTypeSeeder::class,
            SupplierSeeder::class,
            PaymentChannelSeeder::class,
            PricingRuleSeeder::class,

            // === 2. Users ===
            UserSeeder::class,

            // === 3. Catalogue — intentionally NOT seeded ===
            // CategorySeeder, SubCategorySeeder, ServerCategorySeeder,
            // ServerCategoryOptionSeeder, OrderFormSchemaSeeder,
            // ProductSeeder, SupplierCategorySeeder, SupplierProductSeeder.
            // See the class docblock: inventory belongs to the operator.

            // Guarantees the one supplier row two uxiotopup actions resolve with
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
            BannerSeeder::class,
            AnnouncementSeeder::class,

            // § Content & marketing. FlashSaleSeeder self-disables when there
            // are no active products, which is now always the case on a fresh
            // install — it stays in the list for installs that have stock.
            ArticleSeeder::class,
            FaqSeeder::class,
            PageSeeder::class,
            TestimonialSeeder::class,
            SettingSeeder::class,
            PromoSeeder::class,
            FlashSaleSeeder::class,
            MembershipPlanSeeder::class,

            // § Payment-page services kita sells to its clients. After
            // PaymentChannelSeeder, whose rows Monetapay's service points at.
            ServiceSeeder::class,
        ]);
    }
}

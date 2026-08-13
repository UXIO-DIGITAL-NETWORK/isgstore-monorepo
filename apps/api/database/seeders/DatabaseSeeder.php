<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Urutan pemanggilan WAJIB mengikuti dependensi Foreign Key:
     * 1. Foundation (Roles, CategoryTypes, Suppliers, PaymentMethods)
     * 2. Users (depends on Roles)
     * 3. Categories & Sub-components (depends on CategoryTypes)
     * 4. Products & Supplier mappings (depends on Categories, Suppliers)
     * 5. Transactions (depends on Users, Products, Suppliers, PaymentMethods)
     * 6. Auxiliary data (depends on Orders, Users)
     * 7. CMS content (optionally linked to Categories)
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

            // === 3. Category Hierarchy ===
            CategorySeeder::class,
            SubCategorySeeder::class,
            ServerCategorySeeder::class,
            ServerCategoryOptionSeeder::class,
            // Per-game identifier schema + customer_no template. Must run after
            // CategorySeeder; it updates categories in place, keyed on `code`.
            OrderFormSchemaSeeder::class,

            // === 4. Products & Supplier Mapping ===
            ProductSeeder::class,
            SupplierCategorySeeder::class,
            SupplierProductSeeder::class,

            // Map the exact integration required data after all raw data is seeded
            MasterDataSeeder::class,

            // === 5. Transactions ===
            // OrderSeeder::class, // Table renamed to transactions
            // PaymentSeeder::class,

            // === 6. Auxiliary (depends on Orders) ===
            // PointHistorySeeder::class,
            // RatingSeeder::class,
            // UserSpendingSeeder::class,
            // ActivityLogSeeder::class,

            // === 7. CMS Content ===
            BannerSeeder::class,
            AnnouncementSeeder::class,

            // § Content & marketing. Ordered after the catalogue because the
            // flash sale references real products.
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

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ServerCategoryOptionSeeder extends Seeder
{
    /**
     * Intentionally seeds nothing.
     *
     * This used to insert five fabricated MLBB zone options ("Zone 1".."Zone 5" →
     * 2001-2005). Those are not real MLBB zones — a player's zone is a per-account
     * number read from their own profile — so the storefront rendered a dropdown
     * that made nearly every MLBB order carry a wrong zone, which only failed at
     * the supplier after payment had already been taken.
     *
     * MLBB's zone is now a free-text numeric field driven by
     * categories.order_form_fields (see OrderFormSchemaSeeder), and that seeder
     * also deletes any of these rows left over in an existing database.
     *
     * The server_category_options table and its admin CRUD
     * (/v1/server-category-options) remain available for games that genuinely do
     * have a closed set of servers — such options should be entered by an admin
     * who knows the real values, not invented here.
     */
    public function run(): void
    {
        //
    }
}

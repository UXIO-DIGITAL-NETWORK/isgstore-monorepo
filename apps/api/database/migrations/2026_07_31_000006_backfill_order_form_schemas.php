<?php

use Database\Seeders\OrderFormSchemaSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill categories.order_form_fields on environments where the seeder never ran.
 *
 * The deploy pipeline only runs `php artisan migrate --force` — it never runs a
 * seeder — so OrderFormSchemaSeeder had only ever executed locally and in CI.
 * Both staging and production were therefore left with order_form_fields = NULL,
 * which makes OrderFormFields::for() fall back to server_categories and render
 * MLBB's zone as a **dropdown** of the fabricated "Zone 1".."Zone 5" (2001-2005)
 * values. Those are not real zones — a player's zone is a per-account number —
 * so every order placed through that picker carried a wrong id that failed at
 * the supplier only after the customer had paid.
 *
 * Why a migration rather than adding the seeder to the deploy: admins can edit
 * order_form_fields through the panel (UpdateCategoryRequest accepts it), and
 * the seeder overwrites unconditionally. Running it on every deploy would
 * silently discard their configuration. A migration runs exactly once per
 * environment and is tracked, and the guard below means it only ever fills a
 * gap — it never overwrites a value someone deliberately set.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Schemas come from the seeder itself so the two cannot drift.
        foreach (OrderFormSchemaSeeder::schemas() as $code => $schema) {
            DB::table('categories')
                ->where('code', $code)
                ->whereNull('order_form_fields')   // never clobber an admin's own config
                ->update(['order_form_fields' => json_encode($schema)]);
        }

        $this->removeFabricatedMlbbZones();
    }

    /**
     * Belt-and-braces. Strictly redundant once mlbb has a schema — a configured
     * schema always wins in OrderFormFields::for() — but it stops the dropdown
     * reappearing if that column is ever cleared again.
     */
    private function removeFabricatedMlbbZones(): void
    {
        $mlbbId = DB::table('categories')->where('code', 'mlbb')->value('id');

        if (! $mlbbId) {
            return;
        }

        $serverCategoryIds = DB::table('server_categories')
            ->where('category_id', $mlbbId)
            ->pluck('id');

        if ($serverCategoryIds->isNotEmpty()) {
            DB::table('server_category_options')
                ->whereIn('server_category_id', $serverCategoryIds)
                ->delete();
        }
    }

    /**
     * Intentionally a no-op: rolling correct order-form data back to NULL would
     * restore the broken zone dropdown, which is the bug this exists to remove.
     */
    public function down(): void {}
};

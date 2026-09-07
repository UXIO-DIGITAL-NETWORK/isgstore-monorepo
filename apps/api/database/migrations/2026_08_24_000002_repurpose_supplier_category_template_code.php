<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Repurposes `supplier_categories.template_code` into `provider_category`.
 *
 * `template_code` was free text that nothing ever read — not the price sync, not
 * checkout, not Catalog. The admin column labelled "Provider Template" was easy
 * to mistake for the order-form template, which actually lives on
 * `categories.order_form_fields` and is a different thing entirely.
 *
 * It now holds the provider's own `kategori` string (the only categorisation the
 * uxiolabs price list carries), which is what decides WHICH provider SKUs get
 * offered for a category. One column, one meaning.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_categories', function (Blueprint $table) {
            $table->renameColumn('template_code', 'provider_category');
        });

        // The table never had a unique index, so duplicate (supplier, category)
        // pairs are possible in existing data. Collapse exact duplicates of the
        // new key before the index goes on, keeping the oldest row.
        $duplicateIds = DB::table('supplier_categories as sc')
            ->select('sc.id')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('supplier_categories as older')
                    ->whereColumn('older.supplier_id', 'sc.supplier_id')
                    ->whereColumn('older.provider_category', 'sc.provider_category')
                    ->whereColumn('older.id', '<', 'sc.id');
            })
            ->pluck('id');

        if ($duplicateIds->isNotEmpty()) {
            DB::table('supplier_categories')->whereIn('id', $duplicateIds)->delete();
        }

        Schema::table('supplier_categories', function (Blueprint $table) {
            // A provider category maps to exactly one of our categories per
            // supplier — otherwise the same SKU would be claimed by two games.
            $table->unique(['supplier_id', 'provider_category'], 'supplier_categories_provider_unique');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_categories', function (Blueprint $table) {
            $table->dropUnique('supplier_categories_provider_unique');
        });

        Schema::table('supplier_categories', function (Blueprint $table) {
            $table->renameColumn('provider_category', 'template_code');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Turn the standalone "Free Fire Cek Username" product (Digiflazz SKU
 * `ffusername`) into an internal username-check provider:
 *
 *  - point its game category at the SKU (`validasi_nickname = digiflazz:ffusername`)
 *    so checkout can look the player name up, and
 *  - hide the product from the storefront (it is no longer a buyable item).
 *
 * Guarded and idempotent: it only acts when a supplier mapping for `ffusername`
 * exists, so a database without it (fresh install / other environments) is left
 * untouched. Operators can also set this from the admin Category form.
 */
return new class extends Migration
{
    private const SKU = 'ffusername';

    public function up(): void
    {
        $mappings = DB::table('supplier_products')->where('buyer_sku_code', self::SKU)->get();

        foreach ($mappings as $mapping) {
            $product = DB::table('products')->where('id', $mapping->product_id)->first();
            if (! $product) {
                continue;
            }

            // Hide the standalone product from the storefront catalogue.
            $hide = ['status' => false];
            if (Schema::hasColumn('products', 'is_available')) {
                $hide['is_available'] = false;
            }
            DB::table('products')->where('id', $product->id)->update($hide);

            // Attach the SKU as the category's nickname-check provider.
            if ($product->category_id) {
                DB::table('categories')
                    ->where('id', $product->category_id)
                    ->update(['validasi_nickname' => 'digiflazz:'.self::SKU]);
            }
        }
    }

    public function down(): void
    {
        $mappings = DB::table('supplier_products')->where('buyer_sku_code', self::SKU)->get();

        foreach ($mappings as $mapping) {
            $product = DB::table('products')->where('id', $mapping->product_id)->first();
            if (! $product) {
                continue;
            }

            if ($product->category_id) {
                DB::table('categories')
                    ->where('id', $product->category_id)
                    ->where('validasi_nickname', 'digiflazz:'.self::SKU)
                    ->update(['validasi_nickname' => null]);
            }

            $restore = ['status' => true];
            if (Schema::hasColumn('products', 'is_available')) {
                $restore['is_available'] = true;
            }
            DB::table('products')->where('id', $product->id)->update($restore);
        }
    }
};

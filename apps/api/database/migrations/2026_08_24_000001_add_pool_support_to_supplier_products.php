<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Turns `supplier_products` into the provider POOL.
 *
 * Until now a provider SKU could not exist without a Product — `product_id` was
 * NOT NULL — so the only way into the system was to become a sellable product
 * immediately. The admin flow we want is: pull SKUs into a pool, price them,
 * and only then promote them into the catalog as a draft.
 *
 * `unique(supplier_id, buyer_sku_code)` already exists and is left alone: it is
 * the pool's natural key, and it is what makes "pool then promote" an UPDATE of
 * the same row rather than a second INSERT that would violate it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            // The category this SKU is destined for, resolved from the Category
            // Provider mapping at pool time. It points straight at `categories`
            // (not `supplier_categories`) because that is what promote needs to
            // fill `products.category_id`, and what the pool's category filter
            // must match on — the existing filter goes through the product, which
            // a pooled row does not have.
            $table->foreignId('pool_category_id')
                ->nullable()
                ->after('supplier_id')
                ->constrained('categories')
                ->nullOnDelete();

            // Snapshot of the provider's `nama_layanan`. A pooled row has no
            // product, so without this the pool table and the margin page have
            // nothing but a SKU code to render.
            $table->string('provider_name')->nullable()->after('buyer_sku_code');

            // Set on the Set Profit Margin page, carried onto the product at
            // promote time. 0/null = no limit, matching products.price_min/max.
            $table->bigInteger('price_min')->nullable()->after('margin_agent');
            $table->bigInteger('price_max')->nullable()->after('price_min');

            // The explicit gate for "margin has been decided". Deliberately NOT
            // derived from `margin_* IS NOT NULL`: leaving every margin blank so
            // the row falls back to pricing_rules is a legitimate configuration,
            // and deriving would make that configuration unpromotable forever.
            $table->timestamp('margin_set_at')->nullable()->after('price_max');
        });

        // `product_id` becomes nullable — a pooled row has no product yet — and the
        // FK swaps from cascadeOnDelete to nullOnDelete so deleting a product returns
        // its SKU to the pool instead of destroying the mapping (and its margins).
        //
        // SQLite cannot drop a foreign key; its `change()` rebuilds the table and the
        // following `foreign()` re-declares the constraint, so the end state matches.
        $isSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        if (! $isSqlite) {
            Schema::table('supplier_products', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });
        }

        Schema::table('supplier_products', function (Blueprint $table) use ($isSqlite) {
            $table->foreignId('product_id')->nullable()->change();

            if (! $isSqlite) {
                $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
            }
        });

        // Decision #4: every existing mapping already has a product, so it was priced
        // under the old flow and is by definition already promoted and margin-decided.
        // Stamping it keeps the UI from retroactively flagging live rows as unpriced.
        //
        // Chunked in PHP rather than an UPDATE ... JOIN so this runs on every driver —
        // the same approach 2026_08_22_000002_migrate_supplier_to_uxiolabs.php takes.
        DB::table('supplier_products')
            ->whereNotNull('product_id')
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                foreach ($rows as $row) {
                    $product = DB::table('products')->where('id', $row->product_id)->first(['category_id', 'name']);

                    DB::table('supplier_products')->where('id', $row->id)->update([
                        'margin_set_at' => $row->margin_set_at ?? $row->updated_at,
                        'pool_category_id' => $row->pool_category_id ?? $product?->category_id,
                        'provider_name' => $row->provider_name ?? $product?->name,
                    ]);
                }
            });
    }

    public function down(): void
    {
        // Rows still in the pool have no product to point at, so the column cannot
        // go back to NOT NULL while they exist.
        DB::table('supplier_products')->whereNull('product_id')->delete();

        $isSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        if (! $isSqlite) {
            Schema::table('supplier_products', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });
        }

        Schema::table('supplier_products', function (Blueprint $table) use ($isSqlite) {
            $table->foreignId('product_id')->nullable(false)->change();

            if (! $isSqlite) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            }
        });

        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pool_category_id');
            $table->dropColumn(['provider_name', 'price_min', 'price_max', 'margin_set_at']);
        });
    }
};

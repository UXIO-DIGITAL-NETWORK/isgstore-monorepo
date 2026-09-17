<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The supplier is called Uxiotopup again. `suppliers.name` is the key the whole
 * provider pipeline resolves on (see App\Support\Uxiolabs\UxiolabsSupplier), so
 * the row has to move with the code — a lookup that misses it means no price
 * checker, no balance call and no order.
 *
 * Deliberately NOT touched: `integration_credentials.provider`. The previous
 * rename carried it along, but that value is a CONFIG key, not a display name —
 * `config/integrations.php` and `IntegrationConfig::for('uxiolabs')` look the
 * credentials up by it. Moving it here would silently stop the saved API key
 * from being applied and let the env value take over again. Same reason
 * `supplier_products.buyer_sku_code` and the `/v1/uxiolabs/*` routes stay put.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('suppliers')->where('name', 'Uxiolabs')->update(['name' => 'Uxiotopup']);
    }

    public function down(): void
    {
        DB::table('suppliers')->where('name', 'Uxiotopup')->update(['name' => 'Uxiolabs']);
    }
};

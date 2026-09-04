<?php

namespace App\Actions\Uxiolabs;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Uxiolabs\PriceCheckReportDTO;
use App\Enums\PriceChangeLogStatus;
use App\Models\PriceChangeLog;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\SupplierSkuSighting;
use App\Services\ProductRepricer;
use App\Services\UxiolabsService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Compare the uxiolabs price list against existing supplier_products.
 *
 *  - Supplier cost (the configured tier from /service) and availability are
 *    updated automatically — factual data from the supplier that the checkout
 *    margin guard depends on.
 *  - Selling prices of LIVE products are now recomputed AUTOMATICALLY from the
 *    configured margin/pricing rules (via ProductRepricer) whenever cost moves,
 *    UNLESS the product's price is locked — a locked product is left frozen and
 *    only logged for review.
 *  - Every relevant event writes a row to price_change_logs (applied / locked /
 *    negative_margin / deactivated) — the admin's audit trail, which replaces the
 *    old manual price-alert acknowledge flow.
 *  - Unknown service ids are NEVER auto-created — products are added manually
 *    via the admin site (single add or Excel import). They are only counted
 *    in the report.
 *  - Availability keeps the sync_deactivated_at semantics: only mappings this
 *    checker deactivated are ever auto-reactivated, so a manual admin
 *    deactivation is never overridden.
 *
 * Scheduled every 5 minutes; also behind the manual `uxiolabs:sync-products`
 * command and POST /v1/uxiolabs/sync-products.
 */
class CheckUxiolabsPricesAction
{
    private const UPSERT_CHUNK = 500;

    private const UNKNOWN_SAMPLE_LIMIT = 50;

    public function __construct(
        private readonly UxiolabsService $uxiolabsService,
        private readonly CreateActivityLogAction $logAction,
        private readonly ProductRepricer $repricer,
    ) {}

    public function execute(): PriceCheckReportDTO
    {
        // HTTP fetch happens before any DB transaction is opened; warm the
        // shared cache so service preview / manual add / import reuse this list.
        $items = $this->uxiolabsService->getPriceList();
        Cache::put(
            UxiolabsService::PRICE_LIST_CACHE_KEY,
            $items,
            UxiolabsService::PRICE_LIST_CACHE_TTL
        );

        $supplier = Supplier::where('name', 'Uxiolabs')->firstOrFail();

        $report = DB::transaction(fn () => $this->check($supplier->id, $items));

        // 288 runs/day — only log when something actually changed.
        if ($report->priceChangedCount > 0 || $report->deactivated !== [] || $report->reactivated !== []) {
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: auth()->id(),
                ipAddress: request()?->ip() ?? '127.0.0.1',
                userAgent: request()?->userAgent() ?? 'System/Scheduler',
                message: "Cek harga uxiolabs: {$report->priceChangedCount} modal berubah — "
                    ."{$report->repricedCount} di-reprice, {$report->lockedCount} terkunci, "
                    ."{$report->negativeMarginCount} margin negatif, "
                    ."{$report->deactivatedLoggedCount} nonaktif (perlu perhatian).",
                isSystem: true,
            ));
        }

        return $report;
    }

    /**
     * @param  array<int,array<string,mixed>>  $items
     */
    private function check(int $supplierId, array $items): PriceCheckReportDTO
    {
        $now = now();

        // with('product'): reprice needs the product's category, limits, lock and
        // current selling prices — load them once instead of per row.
        $existingMappings = SupplierProduct::where('supplier_id', $supplierId)
            ->with('product')
            ->get()
            ->keyBy('buyer_sku_code');

        $this->recordSightings($supplierId, $items);

        $deactivated = [];
        $reactivated = [];
        $unknownCount = 0;
        $unknownSample = [];
        $priceChanged = 0;
        $repriced = 0;
        $lockedCount = 0;
        $negativeMarginCount = 0;
        $deactivatedLogged = 0;
        $upsertRows = [];
        $productUpdates = [];
        $logRows = [];

        foreach ($items as $item) {
            // buyer_sku_code stores the uxiolabs service id (`id` in /service).
            $sku = (string) ($item['id'] ?? '');
            if ($sku === '') {
                continue;
            }

            $existing = $existingMappings->get($sku);

            if (! $existing) {
                // Manual-only product flow: never auto-create, just count.
                $unknownCount++;
                if (count($unknownSample) < self::UNKNOWN_SAMPLE_LIMIT) {
                    $unknownSample[] = $sku;
                }

                continue;
            }

            $cost = $this->uxiolabsService->costFor($item);
            $available = UxiolabsService::isItemActive($item);

            $costChanged = (int) $existing->price !== $cost;
            $wasActive = (bool) $existing->is_active;

            if ($available && ! $wasActive && $existing->sync_deactivated_at !== null) {
                // Only re-activate what this checker itself turned off.
                $isActive = true;
                $syncDeactivatedAt = null;
                $reactivated[] = $sku;
            } elseif (! $available && $wasActive) {
                $isActive = false;
                $syncDeactivatedAt = $now;
                $deactivated[] = $sku;
            } else {
                $isActive = $wasActive;
                $syncDeactivatedAt = $existing->sync_deactivated_at;
            }

            // uxiolabs has a single aktif/nonaktif flag — mirror it into both
            // status columns so the schema stays untouched.
            $statusChanged = $isActive !== $wasActive
                || (bool) $existing->buyer_product_status !== $available
                || (bool) $existing->seller_product_status !== $available;

            if ($costChanged) {
                $priceChanged++;
            }

            // Auto-reprice + audit log. Only mapped products have a selling price;
            // a pooled row (product_id null) has nothing to reprice or log — its
            // cost still updates below and its preview prices move with it.
            $product = $existing->product;

            if ($existing->product_id !== null && $product !== null) {
                if (! $available && $wasActive) {
                    // Went dark at the provider this run — can't be sold until the
                    // admin handles it. Attention outranks a locked-price note, so
                    // this is the only row we write for the mapping this run.
                    $logRows[] = $this->makeLogRow(
                        PriceChangeLogStatus::DEACTIVATED, $existing, $product,
                        (int) $existing->price, $cost, null,
                        'SKU dinonaktifkan di provider — perlu perhatian admin.', $now,
                    );
                    $deactivatedLogged++;
                } elseif ($costChanged && $isActive && $available) {
                    if ($product->is_price_locked) {
                        // Frozen by the admin — record the drift, do not reprice.
                        $logRows[] = $this->makeLogRow(
                            PriceChangeLogStatus::LOCKED, $existing, $product,
                            (int) $existing->price, $cost, null,
                            'Harga terkunci — modal berubah tapi harga jual dibekukan. Tinjau.', $now,
                        );
                        $lockedCount++;
                    } else {
                        $newPrices = $this->repricer->compute($cost, $product, $existing);
                        $productUpdates[$product->id] = $newPrices;

                        // ceil() keeps price >= cost, so the only way member ends up
                        // below cost is price_max clamping it there.
                        $isNegative = $newPrices['price_member'] < $cost;
                        $logRows[] = $this->makeLogRow(
                            $isNegative ? PriceChangeLogStatus::NEGATIVE_MARGIN : PriceChangeLogStatus::APPLIED,
                            $existing, $product, (int) $existing->price, $cost, $newPrices,
                            $isNegative
                                ? 'Setelah markup & clamp, harga member masih di bawah modal.'
                                : 'Harga jual diperbarui otomatis dari aturan margin.',
                            $now,
                        );
                        $isNegative ? $negativeMarginCount++ : $repriced++;
                    }
                }
            }

            // A pooled row renders from this snapshot (it has no product to read a
            // name from), so keep it in step with the provider. Once promoted, the
            // product owns the name and this is left as the record of what it was
            // pooled as.
            $providerName = $existing->product_id === null
                ? (string) ($item['nama_layanan'] ?? $existing->provider_name)
                : $existing->provider_name;

            $metaChanged = $providerName !== $existing->provider_name;

            // Nothing to write unless something actually moved. `$metaChanged` has to
            // be part of this test AND of the upsert column list below, or the
            // refresh silently never lands.
            if (! $costChanged && ! $statusChanged && ! $metaChanged) {
                continue;
            }

            $upsertRows[] = [
                'supplier_id' => $supplierId,
                'buyer_sku_code' => $sku,
                'product_id' => $existing->product_id,
                'pool_category_id' => $existing->pool_category_id,
                'provider_name' => $providerName,
                'price' => $cost,
                'admin_fee' => $existing->admin_fee,
                'commission' => $existing->commission,
                'buyer_product_status' => $available,
                'seller_product_status' => $available,
                'is_active' => $isActive,
                'sync_deactivated_at' => $syncDeactivatedAt,
                'created_at' => $existing->created_at,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($upsertRows, self::UPSERT_CHUNK) as $chunk) {
            SupplierProduct::upsert(
                $chunk,
                ['supplier_id', 'buyer_sku_code'],
                ['price', 'provider_name', 'admin_fee', 'commission', 'buyer_product_status', 'seller_product_status', 'is_active', 'sync_deactivated_at', 'updated_at']
            );
        }

        // Selling prices differ per product (different tiers), so this can't ride the
        // upsert above. The set is only the live, unlocked products whose cost moved
        // this run — small in steady state.
        foreach ($productUpdates as $productId => $prices) {
            Product::whereKey($productId)->update($prices);
        }

        // Append-only: plain insert, chunked. insert() bypasses casts, so the rows
        // are already raw scalars with explicit timestamps.
        foreach (array_chunk($logRows, self::UPSERT_CHUNK) as $chunk) {
            PriceChangeLog::insert($chunk);
        }

        return new PriceCheckReportDTO(
            totalFetched: count($items),
            priceChangedCount: $priceChanged,
            repricedCount: $repriced,
            lockedCount: $lockedCount,
            negativeMarginCount: $negativeMarginCount,
            deactivatedLoggedCount: $deactivatedLogged,
            deactivated: $deactivated,
            reactivated: $reactivated,
            negativeMargin: $this->scanNegativeMargins(),
            unknownCount: $unknownCount,
            unknownSkusSample: $unknownSample,
        );
    }

    /**
     * One price_change_logs row as a raw array for bulk insert(). Old selling
     * prices are snapshotted off the product; new prices come from the freshly
     * computed set, or null for events that don't reprice (locked, deactivated).
     *
     * @param  array{price_modal:int,price_member:int,price_vip:int,price_reseller:int,price_agent:int}|null  $newPrices
     * @return array<string,mixed>
     */
    private function makeLogRow(
        PriceChangeLogStatus $status,
        SupplierProduct $mapping,
        Product $product,
        int $oldCost,
        int $newCost,
        ?array $newPrices,
        string $reason,
        Carbon $now,
    ): array {
        return [
            'supplier_product_id' => $mapping->id,
            'product_id' => $product->id,
            'buyer_sku_code' => $mapping->buyer_sku_code,
            'product_name' => $product->name,
            'status' => $status->value,
            'old_cost' => $oldCost,
            'new_cost' => $newCost,
            'old_price_member' => (int) $product->price_member,
            'new_price_member' => $newPrices['price_member'] ?? null,
            'old_price_vip' => (int) $product->price_vip,
            'new_price_vip' => $newPrices['price_vip'] ?? null,
            'old_price_reseller' => (int) $product->price_reseller,
            'new_price_reseller' => $newPrices['price_reseller'] ?? null,
            'old_price_agent' => (int) $product->price_agent,
            'new_price_agent' => $newPrices['price_agent'] ?? null,
            'reason' => $reason,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    /**
     * Stamps the first time each SKU was seen upstream, so the Add panel can tell
     * "the provider just added this" from "we have simply never pooled it".
     *
     * Steady state is one pluck and no writes: only SKUs we have never recorded are
     * inserted. On the very first run every SKU is unseen, so the whole catalogue is
     * backdated instead — otherwise the pipeline would open with thousands of rows
     * all flagged New, which is the same as flagging none.
     *
     * @param  array<int,array<string,mixed>>  $items
     */
    private function recordSightings(int $supplierId, array $items): void
    {
        $known = SupplierSkuSighting::where('supplier_id', $supplierId)
            ->pluck('buyer_sku_code')
            ->flip();

        $isFirstRun = $known->isEmpty();
        $seenAt = $isFirstRun
            ? now()->subDays(SupplierSkuSighting::NEW_FOR_DAYS + 1)
            : now();

        $rows = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $sku = (string) ($item['id'] ?? '');

            if ($sku === '' || $known->has($sku)) {
                continue;
            }

            $known->put($sku, true);

            $rows[] = [
                'supplier_id' => $supplierId,
                'buyer_sku_code' => $sku,
                'provider_category' => trim((string) ($item['kategori'] ?? '')) ?: null,
                'first_seen_at' => $seenAt,
            ];
        }

        foreach (array_chunk($rows, self::UPSERT_CHUNK) as $chunk) {
            // insertOrIgnore: two overlapping runs must not collide on the unique key.
            SupplierSkuSighting::insertOrIgnore($chunk);
        }
    }

    /**
     * Products whose member price is now below the active supplier cost —
     * these fail checkout's margin guard until repriced, so surface them.
     *
     * The INNER JOIN on `products` is load-bearing: a pooled mapping has a null
     * `product_id` and therefore no selling price to compare, so it drops out here
     * for free. Do not "fix" this into a left join.
     *
     * @return array<int,array{sku:string,product:string,cost:int,price_member:int}>
     */
    private function scanNegativeMargins(): array
    {
        return DB::table('products')
            ->join('supplier_products', function ($join) {
                $join->on('products.id', '=', 'supplier_products.product_id')
                    ->where('supplier_products.is_active', true);
            })
            ->whereColumn('products.price_member', '<', 'supplier_products.price')
            ->get([
                'supplier_products.buyer_sku_code',
                'products.name',
                'supplier_products.price',
                'products.price_member',
            ])
            ->map(fn ($row) => [
                'sku' => $row->buyer_sku_code,
                'product' => $row->name,
                'cost' => (int) $row->price,
                'price_member' => (int) $row->price_member,
            ])
            ->all();
    }
}

<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Digiflazz\SyncProductsReportDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Category;
use App\Models\CategoryType;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\DigiflazzService;
use App\Services\PricingService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Synchronise the Digiflazz price list into supplier_products and products.
 *
 *  - Existing mappings: supplier cost + availability updated via chunked upsert;
 *    selling prices recomputed through PricingService when products.auto_price.
 *  - Unknown SKUs whose code matches an existing product: mapping auto-created.
 *  - Completely new SKUs: product auto-created INACTIVE (status=false) for
 *    admin review, priced via PricingService, categorised via the
 *    config('digiflazz.category_map') brand map with an `uncategorized`
 *    fallback that is self-provisioned (seeders don't run in production).
 *  - Availability flips stamp sync_deactivated_at so the sync only ever
 *    re-activates mappings it deactivated itself — never an admin's choice.
 */
class SyncDigiflazzProductsAction
{
    private const UPSERT_CHUNK = 500;

    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly PricingService $pricingService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(string $type = 'prepaid'): SyncProductsReportDTO
    {
        if (! in_array($type, ['prepaid', 'pasca'], true)) {
            throw new \InvalidArgumentException("Type harus 'prepaid' atau 'pasca'.");
        }

        // HTTP fetch happens before any DB transaction is opened.
        $items = $this->digiflazzService->getPriceList($type);

        $supplier = Supplier::where('name', 'Digiflazz')->firstOrFail();

        $report = DB::transaction(fn () => $this->sync($supplier->id, $type, $items));

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: auth()->id(),
            ipAddress: request()?->ip() ?? '127.0.0.1',
            userAgent: request()?->userAgent() ?? 'System/Scheduler',
            message: "Sinkronisasi Digiflazz ({$type}): {$report->totalFetched} SKU, "
                .count($report->newProducts).' produk baru, '
                ."{$report->priceChangedCount} perubahan harga, "
                .count($report->deactivated).' dinonaktifkan.',
        ));

        return $report;
    }

    /**
     * @param  array<int,array<string,mixed>>  $items
     */
    private function sync(int $supplierId, string $type, array $items): SyncProductsReportDTO
    {
        $now = now();

        // One query each: current mappings and products keyed by their code.
        $existingMappings = SupplierProduct::where('supplier_id', $supplierId)
            ->get()
            ->keyBy('buyer_sku_code');
        $productsByCode = Product::all(['id', 'code', 'category_id', 'status', 'auto_price'])
            ->keyBy('code');

        $categoryMap = config('digiflazz.category_map', []);
        $categoriesByCode = Category::all(['id', 'code'])->keyBy('code');

        $newProducts = [];
        $deactivated = [];
        $reactivated = [];
        $unmappedBrands = [];
        $skippedSkus = [];
        $priceChanged = 0;
        $upsertRows = [];
        $repriceProductIds = [];

        foreach ($items as $item) {
            $sku = (string) ($item['buyer_sku_code'] ?? '');
            if ($sku === '') {
                continue;
            }

            // Prepaid carries `price`; pasca carries `admin` (+ `commission`).
            $cost = (int) ($type === 'pasca' ? ($item['admin'] ?? 0) : ($item['price'] ?? 0));
            $adminFee = $type === 'pasca' ? (int) ($item['admin'] ?? 0) : null;
            $commission = $type === 'pasca' ? (int) ($item['commission'] ?? 0) : null;
            $available = (bool) ($item['buyer_product_status'] ?? false)
                && (bool) ($item['seller_product_status'] ?? false);

            $existing = $existingMappings->get($sku);

            if (! $existing) {
                $result = $this->createMappingForNewSku(
                    $supplierId, $type, $item, $sku, $cost, $adminFee, $commission, $available,
                    $productsByCode, $categoriesByCode, $categoryMap, $unmappedBrands
                );

                if ($result === null) {
                    $skippedSkus[] = $sku;
                } elseif ($result !== false) {
                    $newProducts[] = $result;
                }

                continue;
            }

            // ── Existing mapping: detect changes ─────────────────────────────
            $costChanged = (int) $existing->price !== $cost;
            $wasActive = (bool) $existing->is_active;

            if ($available && ! $wasActive && $existing->sync_deactivated_at !== null) {
                // Only re-activate what this sync itself turned off.
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

            $statusChanged = $isActive !== $wasActive
                || (bool) $existing->buyer_product_status !== (bool) ($item['buyer_product_status'] ?? false)
                || (bool) $existing->seller_product_status !== (bool) ($item['seller_product_status'] ?? false)
                || ($type === 'pasca' && ((int) $existing->admin_fee !== $adminFee || (int) $existing->commission !== $commission));

            if (! $costChanged && ! $statusChanged) {
                continue;
            }

            if ($costChanged) {
                $priceChanged++;
            }

            $upsertRows[] = [
                'supplier_id' => $supplierId,
                'buyer_sku_code' => $sku,
                'product_id' => $existing->product_id,
                'price' => $cost,
                'admin_fee' => $adminFee ?? $existing->admin_fee,
                'commission' => $commission ?? $existing->commission,
                'buyer_product_status' => (bool) ($item['buyer_product_status'] ?? false),
                'seller_product_status' => (bool) ($item['seller_product_status'] ?? false),
                'is_active' => $isActive,
                'sync_deactivated_at' => $syncDeactivatedAt,
                'created_at' => $existing->created_at,
                'updated_at' => $now,
            ];

            // Selling prices track the ACTIVE supplier cost on prepaid products.
            if ($type === 'prepaid' && $costChanged && $isActive) {
                $repriceProductIds[$existing->product_id] = $cost;
            }
        }

        foreach (array_chunk($upsertRows, self::UPSERT_CHUNK) as $chunk) {
            SupplierProduct::upsert(
                $chunk,
                ['supplier_id', 'buyer_sku_code'],
                ['price', 'admin_fee', 'commission', 'buyer_product_status', 'seller_product_status', 'is_active', 'sync_deactivated_at', 'updated_at']
            );
        }

        $this->recalculateSellingPrices($repriceProductIds);

        return new SyncProductsReportDTO(
            type: $type,
            totalFetched: count($items),
            priceChangedCount: $priceChanged,
            newProducts: $newProducts,
            deactivated: $deactivated,
            reactivated: $reactivated,
            negativeMargin: $this->scanNegativeMargins(),
            unmappedBrands: array_values(array_unique($unmappedBrands)),
            skippedSkus: $skippedSkus,
        );
    }

    /**
     * Handle a SKU with no supplier_products row yet. Links to an existing
     * product when the code matches, otherwise auto-creates an inactive one.
     *
     * @param  array<string,mixed>  $item
     * @param  array<string,string>  $categoryMap
     * @param  array<int,string>  $unmappedBrands
     * @return array{sku:string,name:string,category:string}|false|null
     *                                                                  array = new product created, false = linked to existing product, null = skipped
     */
    private function createMappingForNewSku(
        int $supplierId,
        string $type,
        array $item,
        string $sku,
        int $cost,
        ?int $adminFee,
        ?int $commission,
        bool $available,
        Collection $productsByCode,
        Collection $categoriesByCode,
        array $categoryMap,
        array &$unmappedBrands
    ): array|false|null {
        $name = trim((string) ($item['product_name'] ?? ''));

        if ($cost <= 0 || $name === '') {
            return null;
        }

        $product = $productsByCode->get($sku);
        $isNewProduct = false;

        if (! $product) {
            $brand = strtoupper(trim((string) ($item['brand'] ?? '')));
            $categoryCode = $categoryMap[$brand] ?? null;
            $category = $categoryCode ? $categoriesByCode->get($categoryCode) : null;

            if (! $category) {
                $category = $this->fallbackCategory($categoriesByCode);
                $unmappedBrands[] = $brand !== '' ? $brand : '(no brand)';
            }

            $product = Product::create([
                'category_id' => $category->id,
                'sub_category_id' => null,
                'name' => $name,
                'code' => $sku,
                'auto_price' => true,
                // Hidden from the storefront until an admin reviews & activates.
                'status' => false,
                ...$this->pricingService->computePrices($cost, $category->id),
            ]);
            $productsByCode->put($sku, $product);
            $isNewProduct = true;
        }

        SupplierProduct::create([
            'product_id' => $product->id,
            'supplier_id' => $supplierId,
            'buyer_sku_code' => $sku,
            'price' => $cost,
            'admin_fee' => $adminFee,
            'commission' => $commission,
            'buyer_product_status' => (bool) ($item['buyer_product_status'] ?? false),
            'seller_product_status' => (bool) ($item['seller_product_status'] ?? false),
            'is_active' => $available,
        ]);

        if (! $isNewProduct) {
            return false;
        }

        return [
            'sku' => $sku,
            'name' => $name,
            'category' => (string) ($item['brand'] ?? '-'),
        ];
    }

    /**
     * Bulk-recalculate selling prices for auto-priced products whose active
     * Digiflazz cost changed this run.
     *
     * @param  array<int,int>  $costByProductId
     */
    private function recalculateSellingPrices(array $costByProductId): void
    {
        if ($costByProductId === []) {
            return;
        }

        $products = Product::whereIn('id', array_keys($costByProductId))
            ->where('auto_price', true)
            ->get(['id', 'category_id']);

        foreach ($products as $product) {
            $product->update(
                $this->pricingService->computePrices($costByProductId[$product->id], $product->category_id)
            );
        }
    }

    /**
     * Products whose member price is now below the active supplier cost —
     * these fail checkout's margin guard until repriced, so surface them.
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

    private function fallbackCategory(Collection $categoriesByCode): Category
    {
        $code = config('digiflazz.fallback_category_code', 'uncategorized');

        if ($category = $categoriesByCode->get($code)) {
            return $category;
        }

        // Self-provision: seeders never run on production, so the fallback
        // bucket must be creatable on the fly (hidden via status=false).
        $categoryType = CategoryType::firstOrCreate(['name' => 'Uncategorized'], ['status' => true]);
        $category = Category::firstOrCreate(
            ['code' => $code],
            ['type_id' => $categoryType->id, 'name' => 'Uncategorized', 'status' => false]
        );
        $categoriesByCode->put($code, $category);

        return $category;
    }
}

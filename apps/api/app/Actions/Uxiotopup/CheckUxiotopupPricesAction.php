<?php

namespace App\Actions\Uxiotopup;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Uxiotopup\PriceCheckReportDTO;
use App\Enums\PriceAlertStatus;
use App\Models\PriceChangeAlert;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\UxiotopupService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Compare the uxiotopup price list against existing supplier_products.
 *
 *  - Supplier cost (the configured tier from /service) and availability are
 *    updated automatically — factual data from the supplier that the checkout
 *    margin guard depends on.
 *  - Selling prices are NEVER touched: every cost change raises (or updates)
 *    a pending price_change_alert so the admin reprices manually.
 *  - Unknown service ids are NEVER auto-created — products are added manually
 *    via the admin site (single add or Excel import). They are only counted
 *    in the report.
 *  - Availability keeps the sync_deactivated_at semantics: only mappings this
 *    checker deactivated are ever auto-reactivated, so a manual admin
 *    deactivation is never overridden.
 *
 * Scheduled every 5 minutes; also behind the manual `uxiotopup:sync-products`
 * command and POST /v1/uxiotopup/sync-products.
 */
class CheckUxiotopupPricesAction
{
    private const UPSERT_CHUNK = 500;

    private const UNKNOWN_SAMPLE_LIMIT = 50;

    public function __construct(
        private readonly UxiotopupService $uxiotopupService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(): PriceCheckReportDTO
    {
        // HTTP fetch happens before any DB transaction is opened; warm the
        // shared cache so service preview / manual add / import reuse this list.
        $items = $this->uxiotopupService->getPriceList();
        Cache::put(
            UxiotopupService::PRICE_LIST_CACHE_KEY,
            $items,
            UxiotopupService::PRICE_LIST_CACHE_TTL
        );

        $supplier = Supplier::where('name', 'Uxiotopup')->firstOrFail();

        $report = DB::transaction(fn () => $this->check($supplier->id, $items));

        // 288 runs/day — only log when something actually changed.
        if ($report->priceChangedCount > 0 || $report->deactivated !== [] || $report->reactivated !== []) {
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: auth()->id(),
                ipAddress: request()?->ip() ?? '127.0.0.1',
                userAgent: request()?->userAgent() ?? 'System/Scheduler',
                message: "Cek harga uxiotopup: {$report->priceChangedCount} perubahan modal "
                    ."({$report->alertsCreated} alert baru, {$report->alertsUpdated} alert diperbarui), "
                    .count($report->deactivated).' dinonaktifkan, '
                    .count($report->reactivated).' diaktifkan lagi.',
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

        $existingMappings = SupplierProduct::where('supplier_id', $supplierId)
            ->get()
            ->keyBy('buyer_sku_code');

        $pendingAlerts = PriceChangeAlert::where('status', PriceAlertStatus::PENDING->value)
            ->whereIn('supplier_product_id', $existingMappings->pluck('id'))
            ->get()
            ->keyBy('supplier_product_id');

        $deactivated = [];
        $reactivated = [];
        $unknownCount = 0;
        $unknownSample = [];
        $priceChanged = 0;
        $alertsCreated = 0;
        $alertsUpdated = 0;
        $upsertRows = [];

        foreach ($items as $item) {
            // buyer_sku_code stores the uxiotopup service id (`id` in /service).
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

            $cost = $this->uxiotopupService->costFor($item);
            $available = UxiotopupService::isItemActive($item);

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

            // uxiotopup has a single aktif/nonaktif flag — mirror it into both
            // status columns so the schema stays untouched.
            $statusChanged = $isActive !== $wasActive
                || (bool) $existing->buyer_product_status !== $available
                || (bool) $existing->seller_product_status !== $available;

            if ($costChanged) {
                $priceChanged++;

                // Alert dedupe: one pending alert per mapping. old_price stays at
                // the cost from when the alert was first raised; new_price tracks
                // the latest. A revert back to old_price dissolves the alert.
                $pending = $pendingAlerts->get($existing->id);

                if ($pending) {
                    if ($cost === (int) $pending->old_price) {
                        $pending->delete();
                        $pendingAlerts->forget($existing->id);
                    } else {
                        $pending->update(['new_price' => $cost]);
                        $alertsUpdated++;
                    }
                } else {
                    $alert = PriceChangeAlert::create([
                        'supplier_product_id' => $existing->id,
                        'buyer_sku_code' => $sku,
                        'type' => 'prepaid',
                        'old_price' => (int) $existing->price,
                        'new_price' => $cost,
                        'status' => PriceAlertStatus::PENDING,
                    ]);
                    $pendingAlerts->put($existing->id, $alert);
                    $alertsCreated++;
                }
            }

            if (! $costChanged && ! $statusChanged) {
                continue;
            }

            $upsertRows[] = [
                'supplier_id' => $supplierId,
                'buyer_sku_code' => $sku,
                'product_id' => $existing->product_id,
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
                ['price', 'admin_fee', 'commission', 'buyer_product_status', 'seller_product_status', 'is_active', 'sync_deactivated_at', 'updated_at']
            );
        }

        return new PriceCheckReportDTO(
            totalFetched: count($items),
            priceChangedCount: $priceChanged,
            alertsCreated: $alertsCreated,
            alertsUpdated: $alertsUpdated,
            deactivated: $deactivated,
            reactivated: $reactivated,
            negativeMargin: $this->scanNegativeMargins(),
            unknownCount: $unknownCount,
            unknownSkusSample: $unknownSample,
        );
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
}

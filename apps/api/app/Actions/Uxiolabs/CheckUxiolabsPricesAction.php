<?php

namespace App\Actions\Uxiolabs;

use App\Actions\Log\CreateActivityLogAction;
use App\Contracts\SupplierGateway;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Uxiolabs\PriceCheckReportDTO;
use App\Enums\PriceChangeLogSource;
use App\Enums\PriceChangeLogStatus;
use App\Models\FlashSale;
use App\Models\PriceChangeLog;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Models\SupplierSkuSighting;
use App\Support\Uxiolabs\PriceCheckLock;
use App\Support\Uxiolabs\PriceListSync;
use App\Support\Uxiolabs\UxiolabsSupplier;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Compare the uxiolabs price list against existing supplier_products.
 *
 *  - Supplier cost (the configured tier from /service) and availability are
 *    updated automatically — factual data from the supplier that the checkout
 *    margin guard depends on.
 *  - Selling prices of LIVE products are recomputed AUTOMATICALLY from the
 *    configured margin/pricing rules (via ProductRepricer) whenever cost moves.
 *    Nothing freezes a selling price: a stale one is what makes checkout refuse
 *    an order ("harga modal supplier sedang naik"), so the margin rule wins.
 *  - Every relevant event writes a row to price_change_logs (applied / unchanged /
 *    negative_margin / deactivated) — the admin's audit trail, which replaces the
 *    old manual price-alert acknowledge flow. A row's status and numbers are read
 *    back off what was actually written, so the log never claims a price nobody
 *    is charged.
 *  - One run at a time (a cache lock), one product at a time: a single row that
 *    cannot be repriced costs that row only, and is reported as failed rather
 *    than rolling the whole catalogue back onto its old cost.
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

    /** First N SKUs whose reprice failed, for the report — enough to start with, not a log dump. */
    private const FAILED_SAMPLE_LIMIT = 20;

    public function __construct(
        private readonly SupplierGateway $uxiolabsService,
        private readonly CreateActivityLogAction $logAction,
        private readonly SyncSupplierProductAction $syncProduct,
    ) {}

    public function execute(): PriceCheckReportDTO
    {
        // The lock is shared with the on-demand checkout re-check (PriceCheckLock),
        // so the two can never be writing prices from different snapshots at once.
        $report = PriceCheckLock::attempt(fn () => $this->run());

        return $report ?? PriceCheckReportDTO::skipped('Sinkronisasi harga lain sedang berjalan.');
    }

    private function run(): PriceCheckReportDTO
    {
        // HTTP fetch happens before any DB transaction is opened; warm the
        // shared cache so service preview / manual add / import reuse this list.
        $items = $this->uxiolabsService->getPriceList();
        Cache::put(
            $this->uxiolabsService->priceListCacheKey(),
            $items,
            $this->uxiolabsService->priceListCacheTtl()
        );
        // Stamped so the on-demand re-check can tell "this list is seconds old"
        // from "nothing has synced in a while" without a column per row.
        PriceListSync::markFetched();

        $supplier = UxiolabsSupplier::modelOrFail();

        $report = DB::transaction(fn () => $this->check($supplier->id, $items));

        // 288 runs/day — only log when something actually changed.
        if ($report->priceChangedCount > 0 || $report->deactivated !== [] || $report->reactivated !== []) {
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: auth()->id(),
                ipAddress: request()?->ip() ?? '127.0.0.1',
                userAgent: request()?->userAgent() ?? 'System/Scheduler',
                message: "Cek harga Uxiotopup: {$report->priceChangedCount} modal berubah — "
                    ."{$report->repricedCount} di-reprice, {$report->unchangedCount} tetap, "
                    ."{$report->failedCount} gagal, "
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

        // with('product'): reprice needs the product's category, limits and
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
        $unchangedCount = 0;
        $failedCount = 0;
        $failedSample = [];
        $negativeMarginCount = 0;
        $deactivatedLogged = 0;
        $upsertRows = [];
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

            // Everything from here down — cost, availability, reprice, audit row and
            // the mapping row — is decided by the action the checkout re-check also
            // calls, so the two paths cannot drift apart.
            $result = $this->syncProduct->execute($existing, $item, $now, PriceChangeLogSource::SWEEP);

            if ($result->costChanged) {
                $priceChanged++;
            }

            if ($result->reactivated) {
                $reactivated[] = $sku;
            }

            if ($result->deactivatedNow) {
                $deactivated[] = $sku;
            }

            if ($result->logStatus === PriceChangeLogStatus::DEACTIVATED) {
                $deactivatedLogged++;
            } elseif ($result->logStatus === PriceChangeLogStatus::NEGATIVE_MARGIN) {
                $negativeMarginCount++;
            } elseif ($result->logStatus === PriceChangeLogStatus::UNCHANGED) {
                $unchangedCount++;
            } elseif ($result->logStatus === PriceChangeLogStatus::APPLIED) {
                $repriced++;
            }

            if ($result->repriceFailed) {
                $failedCount++;
                if (count($failedSample) < self::FAILED_SAMPLE_LIMIT) {
                    $failedSample[] = $sku;
                }
            }

            if ($result->logRow !== null) {
                $logRows[] = $result->logRow;
            }

            // Null when nothing moved — the same "skip the write" the old upsert
            // test made here.
            if ($result->upsertRow !== null) {
                $upsertRows[] = $result->upsertRow;
            }
        }

        SyncSupplierProductAction::upsert($upsertRows);

        // Append-only: plain insert, chunked. insert() bypasses casts, so the rows
        // are already raw scalars with explicit timestamps.
        foreach (array_chunk($logRows, self::UPSERT_CHUNK) as $chunk) {
            PriceChangeLog::insert($chunk);
        }

        return new PriceCheckReportDTO(
            totalFetched: count($items),
            priceChangedCount: $priceChanged,
            repricedCount: $repriced,
            unchangedCount: $unchangedCount,
            failedCount: $failedCount,
            negativeMarginCount: $negativeMarginCount,
            deactivatedLoggedCount: $deactivatedLogged,
            deactivated: $deactivated,
            reactivated: $reactivated,
            negativeMargin: $this->scanNegativeMargins(),
            unknownCount: $unknownCount,
            unknownSkusSample: $unknownSample,
            failedSkusSample: $failedSample,
        );
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
     * Products whose BILLED price is below the active supplier cost — the rows
     * checkout's margin guard will refuse, surfaced before a customer finds one.
     *
     * Scanned per PLAN ROW, not against `products.price_member`: that column is
     * one tier's denormalised copy, so a VIP or reseller row under cost used to be
     * invisible here and could only ever appear as a refusal at checkout. A running
     * flash sale is scanned too, for the same reason — it is the price `PlanPrice`
     * returns for that product while the sale runs.
     *
     * The INNER JOIN on `products` is load-bearing: a pooled mapping has a null
     * `product_id` and therefore no selling price to compare, so it drops out here
     * for free. Do not "fix" this into a left join.
     *
     * @return array<int,array{product:string,sku:string,cost:int,tier:string,price:int}>
     */
    private function scanNegativeMargins(): array
    {
        $planRows = DB::table('product_plan_prices')
            ->join('products', 'products.id', '=', 'product_plan_prices.product_id')
            ->join('membership_plans', 'membership_plans.id', '=', 'product_plan_prices.membership_plan_id')
            ->join('supplier_products', function ($join) {
                $join->on('supplier_products.product_id', '=', 'products.id')
                    ->where('supplier_products.is_active', true);
            })
            ->whereColumn('product_plan_prices.price', '<', 'supplier_products.price')
            ->orderBy('products.name')
            ->get([
                'products.name',
                'supplier_products.buyer_sku_code',
                'supplier_products.price as cost',
                'product_plan_prices.price as billed',
                // Locale-keyed JSON, so the plan's stable code is the label.
                'membership_plans.code as plan_code',
            ])
            ->map(fn ($row) => [
                'product' => (string) $row->name,
                'sku' => (string) $row->buyer_sku_code,
                'cost' => (int) $row->cost,
                'tier' => (string) $row->plan_code,
                'price' => (int) $row->billed,
            ])
            ->all();

        return [...$planRows, ...$this->scanFlashSaleBelowCost()];
    }

    /**
     * A flash sale is a cut below the list price, and — since `PlanPrice` consults
     * it — the price the customer is actually charged while it runs. One priced
     * under the supplier's cost is a below-cost sale for every buyer, not just for
     * the tier that happens to be on the row.
     *
     * @return array<int,array{product:string,sku:string,cost:int,tier:string,price:int}>
     */
    private function scanFlashSaleBelowCost(): array
    {
        // Read through the same scope the pricing path uses, so "running" cannot
        // mean two things.
        $items = FlashSale::running()->with('items')->get()->flatMap->items;

        if ($items->isEmpty()) {
            return [];
        }

        $productIds = $items->pluck('product_id')->map(fn ($id) => (int) $id)->unique()->all();

        $mappings = SupplierProduct::query()
            ->whereIn('product_id', $productIds)
            ->where('is_active', true)
            ->get(['product_id', 'price', 'buyer_sku_code'])
            ->keyBy('product_id');

        $names = Product::query()->whereIn('id', $productIds)->pluck('name', 'id');

        $rows = [];

        foreach ($items as $item) {
            $mapping = $mappings->get((int) $item->product_id);

            if ($mapping === null || (int) $item->sale_price >= (int) $mapping->price) {
                continue;
            }

            $rows[] = [
                'product' => (string) ($names[(int) $item->product_id] ?? ''),
                'sku' => (string) $mapping->buyer_sku_code,
                'cost' => (int) $mapping->price,
                'tier' => 'flash sale',
                'price' => (int) $item->sale_price,
            ];
        }

        return $rows;
    }
}

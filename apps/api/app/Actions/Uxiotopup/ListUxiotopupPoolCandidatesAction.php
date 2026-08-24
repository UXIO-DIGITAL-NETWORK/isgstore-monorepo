<?php

declare(strict_types=1);

namespace App\Actions\Uxiotopup;

use App\Models\SupplierCategory;
use App\Models\SupplierProduct;
use App\Models\SupplierSkuSighting;
use App\Services\UxiotopupService;
use App\Support\Uxiotopup\PriceListRow;
use App\Support\Uxiotopup\UxiotopupSupplier;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;

/**
 * The Add-panel feed: provider SKUs that belong to a configured Category Provider.
 *
 * This is the screen that makes Category Provider mean something. `supplier_categories`
 * maps a provider `kategori` onto one of our categories; a SKU is offered here only
 * when its `kategori` has such a mapping, so adding "Valorant" as a Category Provider
 * is literally what makes Valorant SKUs appear.
 *
 * Deliberately a sibling of ListUxiotopupPriceListAction rather than a flag on it:
 * that action's output is pinned by tests and by the legacy browse screen, and its
 * default (show everything) is the opposite of this one's.
 */
class ListUxiotopupPoolCandidatesAction
{
    public function __construct(
        private readonly UxiotopupService $uxiotopupService
    ) {}

    /**
     * @param  array{search?:string,provider_category?:string,category_id?:int,pool_state?:string,availability?:string,only_configured?:bool}  $filters
     */
    public function execute(array $filters, int $perPage, int $page): LengthAwarePaginator
    {
        $rows = collect($this->rows($filters));

        $total = $rows->count();
        $slice = $rows->slice(($page - 1) * $perPage, $perPage)->values()->all();

        return new LengthAwarePaginator($slice, $total, $perPage, $page, [
            'path' => Paginator::resolveCurrentPath(),
            'query' => request()->query(),
        ]);
    }

    /**
     * Counts for the pool page's badge — the same pipeline without pagination.
     *
     * @return array<string,int>
     */
    public function summary(): array
    {
        $all = $this->rows(['only_configured' => true, 'pool_state' => 'all', 'availability' => 'all']);

        $pooled = 0;
        $new = 0;

        foreach ($all as $row) {
            if ($row['already_pooled']) {
                $pooled++;
            } elseif ($row['is_new']) {
                $new++;
            }
        }

        return [
            'configured_categories' => $this->mappings()->count(),
            'total_candidates' => count($all),
            'pooled_count' => $pooled,
            'new_count' => $new,
        ];
    }

    /**
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    private function rows(array $filters): array
    {
        // May throw when uxiotopup is down and the cache is cold — the controller
        // translates that into a 502.
        $items = $this->uxiotopupService->getPriceListCached();

        $mappings = $this->mappings();
        $onlyConfigured = $filters['only_configured'] ?? true;

        // One query each for the whole page rather than per row.
        $supplierId = UxiotopupSupplier::id();

        $pooled = $supplierId
            ? SupplierProduct::where('supplier_id', $supplierId)
                ->pluck('product_id', 'buyer_sku_code')
            : collect();

        $newCutoff = now()->subDays(SupplierSkuSighting::NEW_FOR_DAYS);
        $firstSeen = $supplierId
            ? SupplierSkuSighting::where('supplier_id', $supplierId)
                ->pluck('first_seen_at', 'buyer_sku_code')
            : collect();

        $rows = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $kategori = trim((string) ($item['kategori'] ?? ''));
            $mapping = $mappings->get($kategori);

            if ($onlyConfigured && $mapping === null) {
                continue;
            }

            $sku = (string) ($item['id'] ?? '');

            if ($sku === '') {
                continue;
            }

            $alreadyPooled = $pooled->has($sku);
            $alreadyPromoted = $alreadyPooled && $pooled->get($sku) !== null;

            // A SKU we have never recorded a sighting for is one the checker has
            // not run over yet — treat it as new rather than as long-standing.
            $seenAt = $firstSeen->get($sku);
            $isNew = ! $alreadyPooled && ($seenAt === null || $seenAt >= $newCutoff);

            $row = PriceListRow::normalise($item, $this->uxiotopupService, $alreadyPooled);
            $row['already_pooled'] = $alreadyPooled;
            $row['already_promoted'] = $alreadyPromoted;
            $row['is_new'] = $isNew;
            $row['provider_category'] = $kategori;
            $row['mapped_category_id'] = $mapping?->category_id;
            $row['mapped_category_name'] = $mapping?->category?->name;

            if (! $this->passesFilters($row, $filters)) {
                continue;
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * Configured Category Providers for uxiotopup, keyed on the provider's kategori.
     *
     * @return Collection<string,SupplierCategory>
     */
    private function mappings(): Collection
    {
        $supplierId = UxiotopupSupplier::id();

        if ($supplierId === null) {
            return collect();
        }

        return SupplierCategory::with('category')
            ->where('supplier_id', $supplierId)
            ->get()
            ->keyBy('provider_category');
    }

    /**
     * @param  array<string,mixed>  $row
     * @param  array<string,mixed>  $filters
     */
    private function passesFilters(array $row, array $filters): bool
    {
        if (! empty($filters['provider_category']) && $row['provider_category'] !== $filters['provider_category']) {
            return false;
        }

        if (! empty($filters['category_id']) && (int) $row['mapped_category_id'] !== (int) $filters['category_id']) {
            return false;
        }

        // Default to hiding what is already in the pool: this panel exists to add.
        $poolState = $filters['pool_state'] ?? 'new';

        if ($poolState === 'new' && (! $row['is_new'] || $row['already_pooled'])) {
            return false;
        }

        if ($poolState === 'not_pooled' && $row['already_pooled']) {
            return false;
        }

        $availability = $filters['availability'] ?? 'available';

        if ($availability === 'available' && ! $row['available']) {
            return false;
        }

        if ($availability === 'unavailable' && $row['available']) {
            return false;
        }

        if (! empty($filters['search']) && ! PriceListRow::matchesSearch($row, (string) $filters['search'])) {
            return false;
        }

        return true;
    }
}

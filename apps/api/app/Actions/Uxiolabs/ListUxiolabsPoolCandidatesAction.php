<?php

declare(strict_types=1);

namespace App\Actions\Uxiolabs;

use App\Contracts\SupplierGateway;
use App\Models\SupplierCategory;
use App\Models\SupplierProduct;
use App\Models\SupplierSkuSighting;
use App\Support\Uxiolabs\PriceListRow;
use App\Support\Uxiolabs\UxiolabsSupplier;
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
 * Deliberately a sibling of ListUxiolabsPriceListAction rather than a flag on it:
 * that action's output is pinned by tests and by the legacy browse screen, and its
 * default (show everything) is the opposite of this one's.
 */
class ListUxiolabsPoolCandidatesAction
{
    public function __construct(
        private readonly SupplierGateway $uxiolabsService
    ) {}

    /**
     * @param  array{search?:string,provider_category?:string,category_id?:int,pool_state?:string,availability?:string,only_configured?:bool,cost_min?:int,cost_max?:int,sort?:string}  $filters
     */
    public function execute(array $filters, int $perPage, int $page): LengthAwarePaginator
    {
        $rows = $this->sort(collect($this->rows($filters)), $filters['sort'] ?? null);

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
     * What there is to filter on: the provider categories in play, our own
     * categories behind them, and the cost range the provider is charging.
     *
     * The page cannot derive any of it. Which provider categories exist depends
     * on what an admin has mapped under Category Provider, and the cost bounds
     * move every time the price checker runs.
     *
     * **Computed over the whole configured universe, never the active filters.**
     * Recomputing against them makes options vanish as they are used — a filter
     * bar that narrows itself into a dead end is worse than no facets at all.
     *
     * @return array{provider_categories:array<int,array<string,mixed>>,categories:array<int,array<string,mixed>>,cost:array{min:int,max:int}}
     */
    public function facets(): array
    {
        $all = $this->rows(['only_configured' => true, 'pool_state' => 'all', 'availability' => 'all']);

        $providerCategories = [];
        $categories = [];
        $costs = [];

        foreach ($all as $row) {
            $provider = (string) $row['provider_category'];

            $providerCategories[$provider] ??= [
                'provider_category' => $provider,
                'mapped_category_name' => $row['mapped_category_name'],
                'count' => 0,
            ];
            $providerCategories[$provider]['count']++;

            if ($row['mapped_category_id'] !== null) {
                $id = (int) $row['mapped_category_id'];
                $categories[$id] ??= ['id' => $id, 'name' => $row['mapped_category_name'], 'count' => 0];
                $categories[$id]['count']++;
            }

            $costs[] = (int) $row['cost'];
        }

        // Alphabetical, not by count: an admin scans this list for a game they
        // have in mind, and a list that reorders itself as the catalogue grows
        // cannot be scanned by muscle memory.
        ksort($providerCategories, SORT_NATURAL | SORT_FLAG_CASE);
        uasort($categories, fn (array $a, array $b) => strnatcasecmp((string) $a['name'], (string) $b['name']));

        return [
            'provider_categories' => array_values($providerCategories),
            'categories' => array_values($categories),
            'cost' => [
                'min' => $costs === [] ? 0 : min($costs),
                'max' => $costs === [] ? 0 : max($costs),
            ],
        ];
    }

    /**
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    private function rows(array $filters): array
    {
        // May throw when uxiolabs is down and the cache is cold — the controller
        // translates that into a 502.
        $items = $this->uxiolabsService->getPriceListCached();

        $mappings = $this->mappings();
        $onlyConfigured = $filters['only_configured'] ?? true;

        // One query each for the whole page rather than per row.
        $supplierId = UxiolabsSupplier::id();

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

            $row = PriceListRow::normalise($item, $this->uxiolabsService, $alreadyPooled);
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
     * Configured Category Providers for uxiolabs, keyed on the provider's kategori.
     *
     * @return Collection<string,SupplierCategory>
     */
    private function mappings(): Collection
    {
        $supplierId = UxiolabsSupplier::id();

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

        // `isset`, not `empty`: a floor of 0 is a legitimate bound, and `empty`
        // would silently drop it.
        if (isset($filters['cost_min']) && (int) $row['cost'] < (int) $filters['cost_min']) {
            return false;
        }

        if (isset($filters['cost_max']) && (int) $row['cost'] > (int) $filters['cost_max']) {
            return false;
        }

        if (! empty($filters['search']) && ! PriceListRow::matchesSearch($row, (string) $filters['search'])) {
            return false;
        }

        return true;
    }

    /**
     * Ordering, applied after filtering and before the page slice.
     *
     * No sort leaves the provider's own feed order, which is what this page has
     * always shown. Sorting is opt-in rather than a silent new default: the feed
     * order groups a game's denominations together, which is often what an
     * admin adding a catalogue actually wants.
     *
     * @param  Collection<int,array<string,mixed>>  $rows
     * @return Collection<int,array<string,mixed>>
     */
    private function sort(Collection $rows, ?string $sort): Collection
    {
        return match ($sort) {
            'cost_asc' => $rows->sortBy(fn (array $row) => (int) $row['cost'])->values(),
            'cost_desc' => $rows->sortByDesc(fn (array $row) => (int) $row['cost'])->values(),
            // Natural order, so "50" sorts before "500" instead of between "5"
            // and "500" — every denomination name on this page is a number.
            'name_asc' => $rows->sort(fn (array $a, array $b) => strnatcasecmp((string) $a['name'], (string) $b['name']))->values(),
            'name_desc' => $rows->sort(fn (array $a, array $b) => strnatcasecmp((string) $b['name'], (string) $a['name']))->values(),
            default => $rows,
        };
    }
}

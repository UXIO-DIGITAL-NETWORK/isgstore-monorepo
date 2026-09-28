<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Services\UxiolabsService;

/**
 * The shape every top-up supplier adapter must wear.
 *
 * The transaction engine never speaks a supplier's protocol itself: it asks for
 * a price list, resolves an internal product to the supplier's own code, places
 * an order, and polls its status. Those jobs are the whole contract — a client
 * on a different supplier writes ONE adapter behind this interface and changes
 * one line of config. It never edits the engine.
 *
 * Two rules keep that promise:
 *
 *  - **The engine knows the SHAPE, never the brand.** A supplier's own codes
 *    travel as values (`supplier_products.buyer_sku_code`), never as columns or
 *    branches in the engine.
 *  - **Status vocabularies stay inside the adapter.** "Is this item orderable"
 *    is `isItemActive()` here, because only the adapter knows whether its
 *    supplier says `aktif`, `available`, or something else.
 *
 * @see UxiolabsService the default adapter (driver `uxiolabs`)
 */
interface SupplierGateway
{
    /** Cache namespace for the price list, so two adapters never collide. */
    public function priceListCacheKey(): string;

    /** How long a cached price list stays usable, in seconds. */
    public function priceListCacheTtl(): int;

    /** Cache namespace for the supplier balance. */
    public function balanceCacheKey(): string;

    /** How long a cached balance stays usable, in seconds. */
    public function balanceCacheTtl(): int;

    /**
     * The supplier's raw price list. Rows are opaque — normalise them through
     * `PriceListRow`; the only field the engine relies on is the id it sends
     * back as `$serviceId`.
     *
     * @return array<int,array<string,mixed>>
     */
    public function getPriceList(): array;

    /**
     * The price list behind a shared cache, refilled when stale. The scheduled
     * price checker warms this, so callers normally get a hit.
     *
     * @return array<int,array<string,mixed>>
     */
    public function getPriceListCached(): array;

    /**
     * The cached price list indexed by supplier code. Build this ONCE and reuse
     * it when resolving many codes at a time; the rebuild is exactly what this
     * method exists to avoid.
     *
     * @return array<string,array<string,mixed>>
     */
    public function keyedPriceListCached(): array;

    /**
     * One price-list row by supplier code, or null when the supplier no longer
     * lists it.
     *
     * @return array<string,mixed>|null
     */
    public function findServiceInPriceList(string $serviceId): ?array;

    /** What this site pays the supplier for one price-list row. */
    public function costFor(array $item): int;

    /** Whether the supplier would accept an order for this row right now. */
    public function isItemActive(array $item): bool;

    /**
     * The supplier's account balance, in the supplier's own payload shape.
     *
     * @return array<string,mixed>
     */
    public function getBalance(): array;

    /**
     * The balance behind a short shared cache.
     *
     * @return array<string,mixed>
     */
    public function getBalanceCached(): array;

    /**
     * Places an order. `$idtrx` is OUR invoice number; the returned payload must
     * carry the SUPPLIER's own order id, which the caller persists — it is the
     * only key status polling accepts.
     *
     * @return array<string,mixed>
     *
     * @throws SupplierDuplicateOrderException when the supplier reports that an
     *                                         order for this `$idtrx` already exists — the order is placed, so the
     *                                         caller must wait for the callback rather than order again.
     */
    public function createOrder(string $serviceId, string $target, string $kontak, string $idtrx): array;

    /**
     * Status by the SUPPLIER's own order id (never our invoice number).
     *
     * @return array<string,mixed>
     */
    public function checkTransactionStatus(string $orderId): array;
}

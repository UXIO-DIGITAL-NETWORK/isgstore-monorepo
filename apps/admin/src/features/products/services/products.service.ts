import type { PaginatedResponse } from "@/types/api.type";
import { PRODUCTS } from "../data/products.data";
import { PRICE_RANGE_OPTIONS } from "../data/select-options.data";
import type { Product, ProductListParams } from "../types/product.type";

const DEFAULT_PER_PAGE = 10;

// In-memory mutable copy so remove is visible across calls within a session
// (mock-backed only — resets on reload). Swap each method body to a real
// `api.*` call when the backend lands (system_architecture.md §6); the
// interface, the hooks and the UI stay untouched.
const products: Product[] = [...PRODUCTS];

function matchesFilters(row: Product, params: ProductListParams): boolean {
  if (params.category && row.category_name !== params.category) return false;

  if (params.price) {
    const bucket = PRICE_RANGE_OPTIONS.find((option) => option.value === params.price);
    // An unknown bucket narrows to nothing rather than silently passing
    // everything through — a filter that no-ops is worse than an empty table.
    if (!bucket) return false;
    // Bucketed on the retail (`public`) price — the number the toolbar's
    // ranges are worded in and the one the Variant cell shows.
    const inBucket = row.variants.some(
      (variant) =>
        variant.prices.public >= bucket.min && (bucket.max === undefined || variant.prices.public < bucket.max),
    );
    if (!inBucket) return false;
  }

  if (params.search) {
    // Code and game are searched too: a "Search product name" box that ignored
    // the SKU an operator is holding would read as broken.
    const haystack = `${row.name} ${row.code} ${row.game_name}`.toLowerCase();
    if (!haystack.includes(params.search.toLowerCase())) return false;
  }

  return true;
}

function indexOfOrThrow(id: string): number {
  const index = products.findIndex((row) => row.id === id);
  if (index === -1) throw new Error(`No product found for id: ${id}`);
  return index;
}

export const productsService = {
  list: async (params: ProductListParams = {}): Promise<PaginatedResponse<Product>> => {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? DEFAULT_PER_PAGE;
    const filtered = products.filter((row) => matchesFilters(row, params));
    const start = (page - 1) * perPage;
    const pageRows = filtered.slice(start, start + perPage);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      data: pageRows,
      links: {
        first: "/products?page=1",
        last: `/products?page=${lastPage}`,
        prev: page > 1 ? `/products?page=${page - 1}` : null,
        next: page < lastPage ? `/products?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from: pageRows.length ? start + 1 : null,
        last_page: lastPage,
        path: "/products",
        per_page: perPage,
        // The real filtered count. The reference's footer reads "of 9999999",
        // copy-pasted from Transaction like every Category tab before it.
        total: filtered.length,
        to: pageRows.length ? start + pageRows.length : null,
      },
    };
  },

  getById: async (id: string): Promise<Product> => products[indexOfOrThrow(id)],

  /** The selection bar's "Deactive" — lifecycle only, so a deactivated product
   * keeps its `is_available` value and reactivating restores the old state. */
  deactivate: async (id: string): Promise<void> => {
    const index = indexOfOrThrow(id);
    products[index] = { ...products[index], status: "inactive" };
  },

  remove: async (id: string): Promise<void> => {
    products.splice(indexOfOrThrow(id), 1);
  },
};

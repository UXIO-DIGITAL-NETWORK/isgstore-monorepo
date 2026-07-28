import type { PaginatedResponse } from "@/types/api.type";
import { CATEGORY_PROVIDERS } from "../data/category-providers.data";
import type { CategoryProvider, CategoryProviderListParams } from "../types/categoryProvider.type";

const DEFAULT_PER_PAGE = 10;

// In-memory mutable copy so create/update/remove are visible across calls
// within a session (mock-backed only — resets on reload). Swap each method to
// a real `api.*` call when the backend lands (system_architecture.md §6).
const categoryProviders: CategoryProvider[] = [...CATEGORY_PROVIDERS];

function matchesFilters(row: CategoryProvider, params: CategoryProviderListParams): boolean {
  if (params.provider_name && row.provider_name !== params.provider_name) return false;
  if (params.search) {
    // Searches the template too — a "Search category provider" box that
    // ignored a visible column would read as broken.
    const haystack = `${row.provider_name} ${row.provider_template}`.toLowerCase();
    if (!haystack.includes(params.search.toLowerCase())) return false;
  }
  return true;
}

function indexOfOrThrow(id: string): number {
  const index = categoryProviders.findIndex((row) => row.id === id);
  if (index === -1) throw new Error(`No category provider found for id: ${id}`);
  return index;
}

export const categoryProvidersService = {
  list: async (params: CategoryProviderListParams = {}): Promise<PaginatedResponse<CategoryProvider>> => {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? DEFAULT_PER_PAGE;
    const filtered = categoryProviders.filter((row) => matchesFilters(row, params));
    const start = (page - 1) * perPage;
    const pageRows = filtered.slice(start, start + perPage);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      data: pageRows,
      links: {
        first: "/category-providers?page=1",
        last: `/category-providers?page=${lastPage}`,
        prev: page > 1 ? `/category-providers?page=${page - 1}` : null,
        next: page < lastPage ? `/category-providers?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from: pageRows.length ? start + 1 : null,
        last_page: lastPage,
        path: "/category-providers",
        per_page: perPage,
        to: pageRows.length ? start + pageRows.length : null,
        total: filtered.length,
      },
    };
  },

  getById: async (id: string): Promise<CategoryProvider> => categoryProviders[indexOfOrThrow(id)],

  create: async (input: Omit<CategoryProvider, "id" | "created_at" | "updated_at">): Promise<CategoryProvider> => {
    const now = new Date().toISOString();
    const created: CategoryProvider = {
      ...input,
      id: `cprov-${categoryProviders.length + 1}-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    categoryProviders.push(created);
    return created;
  },

  update: async (
    id: string,
    input: Partial<Omit<CategoryProvider, "id" | "created_at" | "updated_at">>,
  ): Promise<CategoryProvider> => {
    const index = indexOfOrThrow(id);
    const updated: CategoryProvider = {
      ...categoryProviders[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    categoryProviders[index] = updated;
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    categoryProviders.splice(indexOfOrThrow(id), 1);
  },
};

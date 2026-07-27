import type { PaginatedResponse } from "@/types/api.type";
import { CATEGORY_TYPES } from "../data/category-types.data";
import type { CategoryStatus } from "../types/category.type";
import type { CategoryType, CategoryTypeListParams } from "../types/categoryType.type";

const DEFAULT_PER_PAGE = 10;

// In-memory mutable copy so create/update/remove are visible across calls
// within a session (mock-backed only — resets on reload).
const categoryTypes: CategoryType[] = [...CATEGORY_TYPES];

function matchesFilters(row: CategoryType, params: CategoryTypeListParams): boolean {
  if (params.search && !row.name.toLowerCase().includes(params.search.toLowerCase())) return false;
  return true;
}

function indexOfOrThrow(id: string): number {
  const index = categoryTypes.findIndex((row) => row.id === id);
  if (index === -1) throw new Error(`No category type found for id: ${id}`);
  return index;
}

// Mock-backed for now (backend not built yet). Swap each method body to a
// real `api.get/post/put/delete(...)` call once the backend ships — hooks/UI
// stay unchanged. See system_architecture.md §6.
export const categoryTypesService = {
  list: async (params: CategoryTypeListParams = {}): Promise<PaginatedResponse<CategoryType>> => {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? DEFAULT_PER_PAGE;
    const filtered = categoryTypes.filter((row) => matchesFilters(row, params));

    const start = (page - 1) * perPage;
    const pageRows = filtered.slice(start, start + perPage);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      data: pageRows,
      links: {
        first: "/category-types?page=1",
        last: `/category-types?page=${lastPage}`,
        prev: page > 1 ? `/category-types?page=${page - 1}` : null,
        next: page < lastPage ? `/category-types?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from: pageRows.length ? start + 1 : null,
        last_page: lastPage,
        path: "/category-types",
        per_page: perPage,
        to: pageRows.length ? start + pageRows.length : null,
        total: filtered.length,
      },
    };
  },

  getById: async (id: string): Promise<CategoryType> => categoryTypes[indexOfOrThrow(id)],

  create: async (input: Omit<CategoryType, "id" | "created_at" | "updated_at">): Promise<CategoryType> => {
    const now = new Date().toISOString();
    const created: CategoryType = {
      ...input,
      id: `ctype-${categoryTypes.length + 1}-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    categoryTypes.push(created);
    return created;
  },

  update: async (
    id: string,
    input: Partial<Omit<CategoryType, "id" | "created_at" | "updated_at">>,
  ): Promise<CategoryType> => {
    const index = indexOfOrThrow(id);
    const updated: CategoryType = { ...categoryTypes[index], ...input, updated_at: new Date().toISOString() };
    categoryTypes[index] = updated;
    return updated;
  },

  /** Own method rather than a `update(id, { status })` call at the row action:
   * a real backend will almost certainly expose a dedicated status endpoint,
   * and this keeps one obvious seam to swap when it does. */
  setStatus: async (id: string, status: CategoryStatus): Promise<CategoryType> => {
    const index = indexOfOrThrow(id);
    const updated: CategoryType = { ...categoryTypes[index], status, updated_at: new Date().toISOString() };
    categoryTypes[index] = updated;
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    categoryTypes.splice(indexOfOrThrow(id), 1);
  },
};

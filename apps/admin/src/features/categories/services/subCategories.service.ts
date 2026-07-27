import type { PaginatedResponse } from "@/types/api.type";
import { SUB_CATEGORIES } from "../data/sub-categories.data";
import type { SubCategory, SubCategoryListParams } from "../types/subCategory.type";

const DEFAULT_PER_PAGE = 10;

// In-memory mutable copy so create/update/remove are visible across calls
// within a session (mock-backed only — resets on reload).
const subCategories: SubCategory[] = [...SUB_CATEGORIES];

function matchesFilters(row: SubCategory, params: SubCategoryListParams): boolean {
  if (params.search) {
    const needle = params.search.toLowerCase();
    const haystack = `${row.name} ${row.currency_name}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (params.category_id && row.category_id !== params.category_id) return false;
  return true;
}

// Mock-backed for now (backend not built yet). Swap each method body to a
// real `api.get/post/put/delete(...)` call once the backend ships — hooks/UI
// stay unchanged. See system_architecture.md §6.
//
// ponytail: no bulk-delete method — `useDeleteSubCategories` maps ids over
// `remove`, so the row menu and the toolbar's "Delete (N)" share one path.
// Add a real batch endpoint here if the API ever exposes one.
export const subCategoriesService = {
  list: async (params: SubCategoryListParams = {}): Promise<PaginatedResponse<SubCategory>> => {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? DEFAULT_PER_PAGE;
    const filtered = subCategories.filter((row) => matchesFilters(row, params));

    const start = (page - 1) * perPage;
    const pageRows = filtered.slice(start, start + perPage);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      data: pageRows,
      links: {
        first: "/sub-categories?page=1",
        last: `/sub-categories?page=${lastPage}`,
        prev: page > 1 ? `/sub-categories?page=${page - 1}` : null,
        next: page < lastPage ? `/sub-categories?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from: pageRows.length ? start + 1 : null,
        last_page: lastPage,
        path: "/sub-categories",
        per_page: perPage,
        to: pageRows.length ? start + pageRows.length : null,
        total: filtered.length,
      },
    };
  },

  getById: async (id: string): Promise<SubCategory> => {
    const found = subCategories.find((row) => row.id === id);
    if (!found) throw new Error(`No sub category found for id: ${id}`);
    return found;
  },

  create: async (input: Omit<SubCategory, "id" | "created_at" | "updated_at">): Promise<SubCategory> => {
    const now = new Date().toISOString();
    const created: SubCategory = {
      ...input,
      id: `sub-${subCategories.length + 1}-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    subCategories.push(created);
    return created;
  },

  update: async (
    id: string,
    input: Partial<Omit<SubCategory, "id" | "created_at" | "updated_at">>,
  ): Promise<SubCategory> => {
    const index = subCategories.findIndex((row) => row.id === id);
    if (index === -1) throw new Error(`No sub category found for id: ${id}`);
    const updated: SubCategory = { ...subCategories[index], ...input, updated_at: new Date().toISOString() };
    subCategories[index] = updated;
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    const index = subCategories.findIndex((row) => row.id === id);
    if (index === -1) throw new Error(`No sub category found for id: ${id}`);
    subCategories.splice(index, 1);
  },
};

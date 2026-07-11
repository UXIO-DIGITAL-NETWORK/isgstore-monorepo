import type { PaginatedResponse } from "@/types/api.type";
import { CATEGORIES } from "../data/categories.data";
import type { Category, CategoryListParams } from "../types/category.type";

const DEFAULT_PER_PAGE = 10;

// In-memory mutable copy so create/update/remove are visible across calls
// within a session (mock-backed only — resets on reload).
const categories: Category[] = [...CATEGORIES];

function matchesFilters(row: Category, params: CategoryListParams): boolean {
  if (params.search) {
    const needle = params.search.toLowerCase();
    const haystack = `${row.name} ${row.code} ${row.slug}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (params.type && row.type !== params.type) return false;
  return true;
}

// Mock-backed for now (backend not built yet). Swap each method body to a
// real `api.get/post/put/delete(...)` call once the backend ships — hooks/UI
// stay unchanged. See system_architecture.md §6.
export const categoriesService = {
  list: async (params: CategoryListParams = {}): Promise<PaginatedResponse<Category>> => {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? DEFAULT_PER_PAGE;
    const filtered = categories.filter((row) => matchesFilters(row, params));

    const start = (page - 1) * perPage;
    const pageRows = filtered.slice(start, start + perPage);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      data: pageRows,
      links: {
        first: "/categories?page=1",
        last: `/categories?page=${lastPage}`,
        prev: page > 1 ? `/categories?page=${page - 1}` : null,
        next: page < lastPage ? `/categories?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from: pageRows.length ? start + 1 : null,
        last_page: lastPage,
        path: "/categories",
        per_page: perPage,
        to: pageRows.length ? start + pageRows.length : null,
        total: filtered.length,
      },
    };
  },

  getById: async (id: string): Promise<Category> => {
    const found = categories.find((row) => row.id === id);
    if (!found) throw new Error(`No category found for id: ${id}`);
    return found;
  },

  create: async (input: Omit<Category, "id" | "created_at" | "updated_at">): Promise<Category> => {
    const now = new Date().toISOString();
    const created: Category = {
      ...input,
      id: `cat-${categories.length + 1}-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    categories.push(created);
    return created;
  },

  update: async (id: string, input: Partial<Omit<Category, "id" | "created_at" | "updated_at">>): Promise<Category> => {
    const index = categories.findIndex((row) => row.id === id);
    if (index === -1) throw new Error(`No category found for id: ${id}`);
    const updated: Category = { ...categories[index], ...input, updated_at: new Date().toISOString() };
    categories[index] = updated;
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    const index = categories.findIndex((row) => row.id === id);
    if (index === -1) throw new Error(`No category found for id: ${id}`);
    categories.splice(index, 1);
  },
};

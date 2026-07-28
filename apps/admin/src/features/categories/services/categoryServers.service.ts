import type { PaginatedResponse } from "@/types/api.type";
import { CATEGORY_SERVERS } from "../data/category-servers.data";
import type { CategoryServer, CategoryServerListParams } from "../types/categoryServer.type";

const DEFAULT_PER_PAGE = 10;

// In-memory mutable copy so create/update/remove are visible across calls
// within a session (mock-backed only — resets on reload).
const categoryServers: CategoryServer[] = [...CATEGORY_SERVERS];

function matchesFilters(row: CategoryServer, params: CategoryServerListParams): boolean {
  if (params.search && !row.name.toLowerCase().includes(params.search.toLowerCase())) return false;
  return true;
}

function indexOfOrThrow(id: string): number {
  const index = categoryServers.findIndex((row) => row.id === id);
  if (index === -1) throw new Error(`No category server found for id: ${id}`);
  return index;
}

// Mock-backed for now (backend not built yet). Swap each method body to a
// real `api.get/post/put/delete(...)` call once the backend ships — hooks/UI
// stay unchanged. See system_architecture.md §6.
//
// No `setStatus` here, unlike categoryTypes.service: this entity has no
// active/inactive concept (§6).
export const categoryServersService = {
  list: async (params: CategoryServerListParams = {}): Promise<PaginatedResponse<CategoryServer>> => {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? DEFAULT_PER_PAGE;
    const filtered = categoryServers.filter((row) => matchesFilters(row, params));

    const start = (page - 1) * perPage;
    const pageRows = filtered.slice(start, start + perPage);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      data: pageRows,
      links: {
        first: "/category-servers?page=1",
        last: `/category-servers?page=${lastPage}`,
        prev: page > 1 ? `/category-servers?page=${page - 1}` : null,
        next: page < lastPage ? `/category-servers?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from: pageRows.length ? start + 1 : null,
        last_page: lastPage,
        path: "/category-servers",
        per_page: perPage,
        to: pageRows.length ? start + pageRows.length : null,
        total: filtered.length,
      },
    };
  },

  getById: async (id: string): Promise<CategoryServer> => categoryServers[indexOfOrThrow(id)],

  create: async (input: Omit<CategoryServer, "id" | "created_at" | "updated_at">): Promise<CategoryServer> => {
    const now = new Date().toISOString();
    const created: CategoryServer = {
      ...input,
      id: `cserver-${categoryServers.length + 1}-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    categoryServers.push(created);
    return created;
  },

  update: async (
    id: string,
    input: Partial<Omit<CategoryServer, "id" | "created_at" | "updated_at">>,
  ): Promise<CategoryServer> => {
    const index = indexOfOrThrow(id);
    const updated: CategoryServer = { ...categoryServers[index], ...input, updated_at: new Date().toISOString() };
    categoryServers[index] = updated;
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    categoryServers.splice(indexOfOrThrow(id), 1);
  },
};

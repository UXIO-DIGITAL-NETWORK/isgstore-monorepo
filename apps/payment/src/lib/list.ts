import type { ApiResponse } from "@/types/api.type";

export interface ListResult<T> {
  rows: T[];
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
}

/**
 * Normalises the two list envelopes the API returns into one shape:
 *   - a Resource collection nests pagination under `data.meta`;
 *   - a raw Laravel paginator puts the pagination keys flat on `data`.
 * Both carry the rows at `data.data`.
 */
export function unwrapList<T>(res: ApiResponse<Record<string, unknown>>): ListResult<T> {
  const payload = res.data ?? {};
  const rows = (payload.data ?? []) as T[];
  const meta = (payload.meta ?? payload) as Record<string, unknown>;

  return {
    rows,
    page: Number(meta.current_page ?? 1),
    lastPage: Number(meta.last_page ?? 1),
    total: Number(meta.total ?? rows.length),
    perPage: Number(meta.per_page ?? rows.length),
  };
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  /** Coarse status bucket for the pills/dropdown: "success" | "pending" | "failed". */
  status_group?: string;
  /** Transaction feed tab: "all" | "sale" | "service". */
  type?: string;
  /** Inclusive created-date bounds, "YYYY-MM-DD". */
  start_date?: string;
  end_date?: string;
  /** Internal view only — narrow the feed to one client. */
  merchant_id?: number;
}

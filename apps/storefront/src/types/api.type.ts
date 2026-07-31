/**
 * Shapes emitted by the Laravel `ApiResponse` trait.
 *
 * Success and error both carry `status`, `code`, `message`, `data`; validation
 * failures use `status: "fail"` with an `errors` bag instead of `data`.
 */
export type ApiResponseStatus = "success" | "error" | "fail";

export interface ApiResponse<T> {
  status: ApiResponseStatus;
  code: number;
  message: string;
  data: T;
}

export interface ApiError {
  status: "error" | "fail";
  code: number;
  message: string;
  /** Present on 422 only — keyed by field name. */
  errors?: Record<string, string[]>;
}

/** Laravel's paginator meta block. */
export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  path: string;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/**
 * `paginatedResponse()` nests the paginator inside `data`, so a list endpoint
 * reads `response.data.data` for the rows and `response.data.meta` for the page
 * info — not `response.meta`.
 */
export interface Paginated<T> {
  data: T[];
  links: PaginationLinks;
  meta: Pagination;
}

export type PaginatedResponse<T> = ApiResponse<Paginated<T>>;

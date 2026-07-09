export type ApiResponseStatus = "success" | "error";

export interface ApiResponse<T> {
  status: ApiResponseStatus;
  message: string;
  data: T;
}

export interface ApiError {
  status: string;
  message: string;
  errors: Record<string, string[]>;
}

/** Laravel paginator shape for server-side tables (system_architecture.md §4.8). */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

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

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Pagination;
}

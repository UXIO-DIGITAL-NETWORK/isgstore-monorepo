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

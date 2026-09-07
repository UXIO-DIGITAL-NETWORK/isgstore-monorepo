import type { User } from "@/types/models/user.model";
import type { ApiResponse } from "@/types/api.type";

/**
 * `LoginAction` / `RegisterAction` return a token pair, not a single token:
 * the access token is short-lived (60 min) and the refresh token carries the
 * 30-day session.
 */
export interface AuthResponseData {
  user: User;
  access_token: string;
  refresh_token: string;
}

export type AuthApiResponse = ApiResponse<AuthResponseData>;

/** Shape of an axios rejection carrying the API's error envelope. */
export type AuthApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
};

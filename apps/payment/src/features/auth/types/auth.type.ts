import type { User } from "@/models/user.model";
import type { ApiResponse } from "@/types/api.type";
import type { LoginFormValues } from "../schemas/auth.schema";

/**
 * What the service actually posts: the form values plus the auto-detected
 * browser timezone — timezone is never a form field the person sees.
 */
export type LoginPayload = LoginFormValues & { timezone: string };

export interface AuthResponseData {
  user: User;
  access_token: string;
  refresh_token: string;
}

export type AuthApiResponse = ApiResponse<AuthResponseData>;

export type AuthApiError = {
  response: {
    data: {
      message: string;
    };
  };
};

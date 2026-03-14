import type { User } from "@/models/user.model";
import type { ApiResponse } from "@/types/api.type";

export interface AuthResponseData {
  user: User;
  token: string;
}

export type AuthApiResponse = ApiResponse<AuthResponseData>;

export type AuthApiError = {
  response: {
    data: {
      message: string;
    };
  };
};

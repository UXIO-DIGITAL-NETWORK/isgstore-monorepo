import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type { AuthApiResponse, LoginPayload } from "../types/auth.type";

export const authService = {
  login: async (data: LoginPayload): Promise<AuthApiResponse> => {
    return await api.post(`${API_VERSION}/auth/login`, data);
  },

  // The API exposes logout under the auth group (`/v1/auth/logout`), not at the
  // root — the previous bare `/logout` never resolved.
  logout: async (): Promise<ApiResponse<null>> => {
    return await api.post(`${API_VERSION}/auth/logout`);
  },
};

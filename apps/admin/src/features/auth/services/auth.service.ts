import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type { AuthApiResponse, LoginPayload } from "../types/auth.type";

export const authService = {
  login: async (data: LoginPayload): Promise<AuthApiResponse> => {
    return await api.post("/auth/login", data);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return await api.post("/logout");
  },
};

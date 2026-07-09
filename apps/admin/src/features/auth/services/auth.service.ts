import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type { AuthApiResponse } from "../types/auth.type";
import type { LoginFormValues } from "../schemas/auth.schema";

export const authService = {
  login: async (data: LoginFormValues): Promise<AuthApiResponse> => {
    return await api.post("/login", data);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return await api.post("/logout");
  },
};

import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type { AuthApiResponse } from "../types/auth.type";
import type { LoginFormValues, RegisterFormValues } from "../schemas/auth.schema";

export const authService = {
  login: async (data: LoginFormValues): Promise<AuthApiResponse> => {
    return await api.post("/login", data);
  },

  register: async (data: RegisterFormValues): Promise<AuthApiResponse> => {
    return await api.post("/register", data);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return await api.post("/logout");
  },
};

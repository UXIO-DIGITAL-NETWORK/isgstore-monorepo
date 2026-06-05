import { api } from "@/config/axios";
import type { ApiResponse } from "@/types/api.type";
import type { AuthApiResponse } from "../types/auth.type";
import type { LoginFormValues, RegisterFormValues, ForgotPasswordFormValues } from "../schemas/auth.schema";

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

  forgotPassword: async (data: ForgotPasswordFormValues): Promise<ApiResponse<null>> => {
    return await api.post("/forgot-password", data);
  },
};

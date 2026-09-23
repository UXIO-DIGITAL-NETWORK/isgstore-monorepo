import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import { PLATFORM_TIMEZONE } from "@/lib/format";
import type { ApiResponse } from "@/types/api.type";
import type { User } from "@/types/models/user.model";
import type { AuthApiResponse } from "../types/auth.type";
import type {
  LoginFormValues,
  RegisterFormValues,
  ForgotPasswordFormValues,
} from "../schemas/auth.schema";

const BASE = `${API_VERSION}/auth`;

// `timezone` is sent with every sign-up and sign-in because the endpoint takes
// it, but it is the platform's one wall clock rather than the visitor's zone:
// the API stores it and every screen renders WIB regardless, so the two must
// not drift apart.

export const authService = {
  login: async (data: LoginFormValues): Promise<AuthApiResponse> => {
    return await api.post(`${BASE}/login`, {
      email: data.email,
      password: data.password,
      timezone: PLATFORM_TIMEZONE,
    });
  },

  google: async (credential: string): Promise<AuthApiResponse> => {
    // `credential` is the Google ID token (JWT) returned by GIS. The API
    // verifies it server-side and returns the same token pair as login.
    return await api.post(`${BASE}/google`, {
      credential,
      timezone: PLATFORM_TIMEZONE,
    });
  },

  register: async (data: RegisterFormValues): Promise<AuthApiResponse> => {
    return await api.post(`${BASE}/register`, {
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: data.password,
      password_confirmation: data.password_confirmation,
      timezone: PLATFORM_TIMEZONE,
    });
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return await api.post(`${BASE}/logout`);
  },

  forgotPassword: async (data: ForgotPasswordFormValues): Promise<ApiResponse<null>> => {
    return await api.post(`${BASE}/forgot-password`, data);
  },

  resetPassword: async (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse<null>> => {
    return await api.post(`${BASE}/reset-password`, data);
  },

  /** Rehydrates the cached user from a token that survived a page reload. */
  me: async (): Promise<ApiResponse<User>> => {
    return await api.get(`${API_VERSION}/me`);
  },
};

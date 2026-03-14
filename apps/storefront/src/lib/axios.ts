import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Add Bearer Token if available
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response Interceptor: Auto-Logout if 401 status
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const isUnauthorized = error.response?.status === 401;
    const isNotLoginRequest = error.config?.url !== "/login";

    if (isUnauthorized && isNotLoginRequest) {
      useAuthStore.getState().clearAuth();
      window.location.replace("/login");
    }

    return Promise.reject(error);
  },
);

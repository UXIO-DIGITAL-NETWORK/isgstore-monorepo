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

api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const isUnauthorized = error.response?.status === 401;
    const isNotLoginRequest = error.config?.url !== "/login";

    if (isUnauthorized && isNotLoginRequest) {
      useAuthStore.getState().clearAuth();
      const locale = window.location.pathname.split("/")[1] || "id";
      window.location.replace(`/${locale}/login`);
    }

    return Promise.reject(error);
  },
);

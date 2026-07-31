import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../services/auth.service";
import type { AuthApiResponse } from "../types/auth.type";
import type { LoginFormValues } from "../schemas/auth.schema";

export const useLogin = () => {
  const navigate = useNavigate();
  const { locale } = useParams({ strict: false }) as { locale: string };
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response: AuthApiResponse, variables: LoginFormValues) => {
      const { access_token, refresh_token, user } = response.data;
      setAuth(access_token, refresh_token, user, variables.remember);
      navigate({ to: "/$locale", params: { locale: locale ?? "id" } });
    },
  });
};

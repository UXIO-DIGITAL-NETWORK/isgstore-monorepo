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
      setAuth(response.data.token, response.data.user, variables.remember);
      navigate({ to: "/$locale", params: { locale: locale ?? "id" } });
    },
  });
};

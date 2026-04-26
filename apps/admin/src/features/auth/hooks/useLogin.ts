import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../services/auth.service";
import type { AuthApiResponse } from "../types/auth.type";
import type { LoginFormValues } from "../schemas/auth.schema";

export const useLogin = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response: AuthApiResponse, variables: LoginFormValues) => {
      setToken(response.data.token, variables.remember);
      navigate({ to: "/dashboard" });
    },
  });
};

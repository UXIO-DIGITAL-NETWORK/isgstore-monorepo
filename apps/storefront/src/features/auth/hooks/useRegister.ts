import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthApiResponse } from "../types/auth.type";

export const useRegister = () => {
  const navigate = useNavigate();
  const { locale } = useParams({ strict: false }) as { locale: string };
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (response: AuthApiResponse) => {
      setAuth(response.data.token, response.data.user);
      navigate({ to: "/$locale", params: { locale: locale ?? "id" } });
    },
  });
};

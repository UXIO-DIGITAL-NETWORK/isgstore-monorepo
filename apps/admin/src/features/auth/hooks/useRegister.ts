import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthApiResponse } from "../types/auth.type";

export const useRegister = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (response: AuthApiResponse) => {
      setToken(response.data.token);
      navigate({ to: "/" });
    },
  });
};

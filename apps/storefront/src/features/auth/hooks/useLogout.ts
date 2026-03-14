import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

export const useLogout = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearAuth();
      navigate({ to: "/login" });
    },
  });
};

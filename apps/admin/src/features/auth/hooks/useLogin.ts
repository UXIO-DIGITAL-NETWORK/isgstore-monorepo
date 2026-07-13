import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { getBrowserTimezone } from "@/utils/getBrowserTimezone";
import { authService } from "../services/auth.service";
import type { LoginFormValues } from "../schemas/auth.schema";

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (values: LoginFormValues) => authService.login({ ...values, timezone: getBrowserTimezone() }),
    onSuccess: (response, variables) => {
      setAuth(response.data, variables.remember);
      navigate({ to: "/admin/dashboard" });
    },
  });
};

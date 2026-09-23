import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { PLATFORM_TIMEZONE } from "@/utils/date";
import { authService } from "../services/auth.service";
import type { LoginFormValues } from "../schemas/auth.schema";

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    // The platform's one wall clock, not the browser's zone: the API stores
    // this value and the panel renders WIB regardless, so the two must not
    // drift apart.
    mutationFn: (values: LoginFormValues) => authService.login({ ...values, timezone: PLATFORM_TIMEZONE }),
    onSuccess: (response, variables) => {
      setAuth(response.data, variables.remember);
      navigate({ to: "/app/dashboard" });
    },
  });
};

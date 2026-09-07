import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { getBrowserTimezone } from "@/utils/getBrowserTimezone";
import { authService } from "../services/auth.service";
import type { LoginFormValues } from "../schemas/auth.schema";
import { isTwoFactorChallenge } from "../types/auth.type";

/**
 * @param onChallenge Called instead of signing in when the account owes a
 *   second factor. The challenge must stay in component state and **never**
 *   reach `useAuthStore`: `requireGuest` bounces anyone holding a token, and
 *   the axios interceptor would attach it as a Bearer. Losing it on reload is
 *   correct — the login simply starts again.
 */
export const useLogin = (onChallenge?: (challengeToken: string) => void) => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (values: LoginFormValues) => authService.login({ ...values, timezone: getBrowserTimezone() }),
    onSuccess: (response, variables) => {
      if (isTwoFactorChallenge(response.data)) {
        onChallenge?.(response.data.challenge_token);
        return;
      }

      setAuth(response.data, variables.remember);
      navigate({ to: "/admin/dashboard" });
    },
  });
};

/** Second step: the code exchanges the challenge for a session. */
export const useVerifyTwoFactor = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({ challengeToken, code }: { challengeToken: string; code: string; remember?: boolean }) =>
      authService.verifyTwoFactor(challengeToken, code),
    onSuccess: (response, variables) => {
      setAuth(response.data, variables.remember ?? false);
      navigate({ to: "/admin/dashboard" });
    },
  });
};

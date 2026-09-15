import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { PLATFORM_TIMEZONE } from "@/utils/date";
import { TWO_FACTOR_SETUP_ROUTE } from "@/middlewares/authMiddleware";
import type { User } from "@/models/user.model";
import { authService } from "../services/auth.service";
import type { LoginFormValues } from "../schemas/auth.schema";
import { isTwoFactorChallenge } from "../types/auth.type";

/**
 * Where a freshly signed-in user actually belongs.
 *
 * The `_protected` guard would bounce an un-enrolled admin anyway, but routing
 * straight there avoids mounting the dashboard for a frame only to throw it
 * away — and every request that frame fires would 403.
 */
const landingRoute = (user: User) =>
  user.two_factor_required && !user.two_factor_enabled ? TWO_FACTOR_SETUP_ROUTE : "/admin/dashboard";

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
    // The platform's one wall clock, not the browser's zone: the API stores
    // this value and buckets every report window on it, and the panel renders
    // WIB regardless — so the two must not drift apart.
    mutationFn: (values: LoginFormValues) => authService.login({ ...values, timezone: PLATFORM_TIMEZONE }),
    onSuccess: (response, variables) => {
      if (isTwoFactorChallenge(response.data)) {
        onChallenge?.(response.data.challenge_token);
        return;
      }

      setAuth(response.data, variables.remember);
      navigate({ to: landingRoute(response.data.user) });
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
      navigate({ to: landingRoute(response.data.user) });
    },
  });
};

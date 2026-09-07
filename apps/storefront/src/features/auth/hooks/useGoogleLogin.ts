import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../services/auth.service";
import type { AuthApiResponse } from "../types/auth.type";

/**
 * Signs the user in from a Google ID token (the `credential` GIS returns).
 * Mirrors useLogin: on success it persists the token pair + user and routes to
 * the locale home. A Google sign-in always establishes a persistent session.
 */
export const useGoogleLogin = () => {
  const navigate = useNavigate();
  const { locale } = useParams({ strict: false }) as { locale: string };
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credential: string) => authService.google(credential),
    onSuccess: (response: AuthApiResponse) => {
      const { access_token, refresh_token, user } = response.data;
      setAuth(access_token, refresh_token, user, true);
      navigate({ to: "/$locale", params: { locale: locale ?? "id" } });
    },
  });
};

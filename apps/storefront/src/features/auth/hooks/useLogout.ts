import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { authService } from "../services/auth.service";
import { clearClientSession } from "@/lib/session";

export const useLogout = () => {
  const navigate = useNavigate();
  const { locale } = useParams({ strict: false }) as { locale: string };

  return useMutation({
    mutationFn: authService.logout,
    // onSettled, not onSuccess: even if the server logout call fails (expired
    // token, offline), the client session is still fully torn down.
    onSettled: () => {
      clearClientSession();
      navigate({ to: "/$locale", params: { locale: locale ?? "id" } });
    },
  });
};

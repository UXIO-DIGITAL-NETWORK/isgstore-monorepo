import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { readRememberChoice, useAuthStore } from "@/store/useAuthStore";
import { authService } from "../services/auth.service";
import { TwoFactorEnrolCard } from "../components/TwoFactorEnrolCard";
import type { AuthApiError } from "../types/auth.type";

/**
 * Enrolment as the last step of signing in.
 *
 * The password (and, for an admin who already has a factor, the code) has been
 * accepted, so there is a real session — but `EnsureTwoFactorSatisfied` refuses
 * every admin route until an authenticator exists, so the dashboard behind this
 * screen would be a shell of 403s. It therefore renders on `AuthLayout` with no
 * sidebar: this is still signing in, and dressing it as a settings page was
 * what made a required step read as an error.
 *
 * There is no way past it but through, which is the point — the API would
 * refuse anyway. "Sign out" is the one exit, and it has to exist: without it
 * an admin who cannot reach their phone right now is stuck on a screen with no
 * doors.
 */
export function TwoFactorEnrolmentPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const setup = useMutation({
    mutationFn: () => authService.setupTwoFactor(),
    onSuccess: (response) => {
      setSecret(response.data.secret);
      setOtpauthUri(response.data.otpauth_uri);
    },
    onError: (error) => toast.error((error as unknown as AuthApiError)?.response?.data?.message ?? t("setupFailed")),
  });

  const confirm = useMutation({
    mutationFn: () => authService.confirmTwoFactor(code),
    onSuccess: (response) => {
      // Confirming revoked every token, this session's included — the pair in
      // the response is the replacement. Storing it is not optional: without
      // it the cookie still holds a token the API has already destroyed. The
      // remember choice is carried over from login so a 30-day session is not
      // quietly demoted to a session-only one by enrolling.
      setAuth(response.data, readRememberChoice());
      toast.success(t("enabled"));
      navigate({ to: "/admin/dashboard" });
    },
    onError: (error) => {
      setCode("");
      toast.error((error as unknown as AuthApiError)?.response?.data?.message ?? t("codeMismatch"));
    },
  });

  return (
    <Box className="flex w-full max-w-md flex-col gap-6">
      <Box className="flex flex-col gap-2">
        <Heading
          level={1}
          variant="section"
        >{t("oneMoreStep")}</Heading>
        <Text variant="muted">{t("enrolSubtitle")}</Text>
      </Box>

      {!secret ? (
        <Box className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
          <Text variant="muted">{t("needAnApp")}</Text>
          <Button
            className="w-fit rounded-xl"
            disabled={setup.isPending}
            onClick={() => setup.mutate()}
          >
            <ShieldCheck className="mr-2 size-4" />
            {setup.isPending ? "Preparing…" : "Start setup"}
          </Button>
        </Box>
      ) : (
        <TwoFactorEnrolCard
          secret={secret}
          otpauthUri={otpauthUri}
          code={code}
          onCodeChange={setCode}
          onConfirm={() => confirm.mutate()}
          isConfirming={confirm.isPending}
          footnote="Turning this on signs out every other device you are logged in on."
        />
      )}

      <Button
        variant="ghost"
        className="w-fit rounded-xl"
        onClick={() => {
          clearAuth();
          navigate({ to: "/login" });
        }}
      >{t("signOut")}</Button>
    </Box>
  );
}

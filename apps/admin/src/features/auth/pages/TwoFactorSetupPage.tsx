import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../services/auth.service";
import { useQrDataUrl } from "../hooks/useQrDataUrl";
import type { AuthApiError } from "../types/auth.type";

/**
 * Account security — enrolling or removing an authenticator.
 *
 * The panel has no other profile page, so this is also where that section
 * starts. Admins are sent here by the axios interceptor when the API refuses an
 * admin route for want of a second factor.
 *
 * The secret is shown as selectable text rather than only as a QR code: it is
 * the fallback when a camera fails or the person is enrolling a desktop
 * authenticator, and it costs nothing to offer.
 */
export default function TwoFactorSetupPage() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const alreadyEnabled = Boolean(user?.two_factor_confirmed_at);
  // Rendered in the browser — the secret is inside this payload and has no
  // business making another round trip to be turned into an image.
  const qrDataUrl = useQrDataUrl(otpauthUri);

  const setup = useMutation({
    mutationFn: () => authService.setupTwoFactor(),
    onSuccess: (response) => {
      setSecret(response.data.secret);
      setOtpauthUri(response.data.otpauth_uri);
    },
    onError: (error) => toast.error((error as unknown as AuthApiError)?.response?.data?.message ?? "Could not start setup"),
  });

  const confirm = useMutation({
    mutationFn: () => authService.confirmTwoFactor(code),
    onSuccess: () => {
      // Enrolling revokes every session, this one included — that is the point,
      // so send them back to sign in rather than leaving a dead token in place.
      toast.success("Two-factor enabled. Please sign in again.");
      clearAuth();
      window.location.replace("/login");
    },
    onError: (error) => toast.error((error as unknown as AuthApiError)?.response?.data?.message ?? "That code did not match"),
  });

  const disable = useMutation({
    mutationFn: () => authService.disableTwoFactor(password),
    onSuccess: () => {
      toast.success("Two-factor disabled. Please sign in again.");
      clearAuth();
      window.location.replace("/login");
    },
    onError: (error) => toast.error((error as unknown as AuthApiError)?.response?.data?.message ?? "Could not disable"),
  });

  return (
    <Box className="flex max-w-2xl flex-col gap-6">
      <Box className="border-border bg-card rounded-2xl border p-6">
        <Heading
          level={1}
          variant="section"
        >
          Two-factor authentication
        </Heading>
        <Text variant="muted">
          A code from your authenticator app, on top of your password. Required for admin accounts — the panel can move
          money and read every customer&rsquo;s contact details.
        </Text>
      </Box>

      {alreadyEnabled ? (
        <Box className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
          <Text>Two-factor is active on this account.</Text>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="disable-password">Confirm your password to turn it off</Label>
            <Input
              id="disable-password"
              type="password"
              className="rounded-xl"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Box>
          <Button
            variant="destructive"
            className="dark:bg-destructive w-fit rounded-xl"
            disabled={disable.isPending || password.length === 0}
            onClick={() => disable.mutate()}
          >
            <ShieldOff className="mr-2 size-4" />
            {disable.isPending ? "Disabling…" : "Disable two-factor"}
          </Button>
        </Box>
      ) : !secret ? (
        <Box className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
          <Text variant="muted">
            You will need an authenticator app — Google Authenticator, 1Password, Authy or similar.
          </Text>
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
        <Box className="border-border bg-card flex flex-col gap-5 rounded-2xl border p-6">
          <Box className="flex flex-col gap-3">
            <Label>1. Scan this with Google Authenticator</Label>
            {qrDataUrl ? (
              <Box className="border-border w-fit rounded-xl border bg-white p-3">
                <img
                  src={qrDataUrl}
                  alt="QR code for your authenticator app"
                  width={200}
                  height={200}
                />
              </Box>
            ) : (
              <Text variant="muted">Preparing the QR code…</Text>
            )}
            <Text
              variant="small"
              className="text-muted-foreground"
            >
              In Google Authenticator: <strong>+</strong> → <strong>Scan a QR code</strong>. No camera? Use{" "}
              <strong>Enter a setup key</strong> with the key below.
            </Text>
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label>Or add this key by hand</Label>
            <Box className="flex items-center gap-2">
              <Input
                readOnly
                value={secret}
                className="rounded-xl font-mono"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  void navigator.clipboard.writeText(secret);
                  toast.success("Key copied");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </Box>
            {otpauthUri && (
              <Text
                variant="small"
                className="text-muted-foreground"
              >
                On this device you can also{" "}
                <a
                  href={otpauthUri}
                  className="underline"
                >
                  open it in your authenticator
                </a>
                .
              </Text>
            )}
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label>2. Enter the six-digit code it shows</Label>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={() => confirm.mutate()}
              disabled={confirm.isPending}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </Box>

          <Text
            variant="small"
            className="text-muted-foreground"
          >
            Turning this on signs you out everywhere, including here.
          </Text>

          <Button
            className="w-fit rounded-xl"
            disabled={confirm.isPending || code.length < 6}
            onClick={() => confirm.mutate()}
          >
            {confirm.isPending ? "Confirming…" : "Confirm and enable"}
          </Button>
        </Box>
      )}
    </Box>
  );
}

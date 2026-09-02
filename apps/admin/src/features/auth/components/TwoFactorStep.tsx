import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useVerifyTwoFactor } from "../hooks/useLogin";
import type { AuthApiError } from "../types/auth.type";

interface Props {
  challengeToken: string;
  remember?: boolean;
  onCancel: () => void;
}

/**
 * The second step of a login.
 *
 * The challenge lives in the parent's component state, never in the auth store:
 * `requireGuest` bounces anyone holding a token and the axios interceptor would
 * attach it as a Bearer. A reload therefore drops it and the login starts
 * again, which is the correct outcome rather than a bug.
 *
 * Five wrong codes end the challenge server-side and the person must sign in
 * from the top; the copy says so rather than leaving them guessing.
 */
export function TwoFactorStep({ challengeToken, remember, onCancel }: Props) {
  const [code, setCode] = useState("");
  const { mutate: verify, isPending, error } = useVerifyTwoFactor();

  const apiErrorMessage = (error as unknown as AuthApiError)?.response?.data?.message;

  const submit = () => verify({ challengeToken, code, remember });

  return (
    <Box className="w-full max-w-[420px]">
      <Box className="mb-8">
        <Heading
          level={2}
          className="mb-3 text-[32px] font-extrabold tracking-tight text-slate-900"
        >
          Two-factor code
        </Heading>
        <Text className="text-slate-500">
          Open your authenticator app and enter the six-digit code for this account.
        </Text>
      </Box>

      <Box className="flex flex-col gap-5">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          // Submitting on the sixth digit saves a click; the code is already
          // complete and there is nothing else on this screen to fill in.
          onComplete={(value) => verify({ challengeToken, code: value, remember })}
          disabled={isPending}
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

        {apiErrorMessage && (
          <Text
            variant="small"
            className="text-destructive"
          >
            {apiErrorMessage}
          </Text>
        )}

        <Button
          type="button"
          onClick={submit}
          disabled={isPending || code.length < 6}
          className="group h-12 w-full rounded-xl"
        >
          <ShieldCheck className="mr-2 size-5" />
          {isPending ? "Verifying…" : "Verify"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full rounded-xl"
        >
          Back to sign in
        </Button>
      </Box>
    </Box>
  );
}

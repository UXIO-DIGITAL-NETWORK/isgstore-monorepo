import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
          // The only field on the screen, and the person already has the code
          // open in front of them.
          autoFocus
          containerClassName="justify-center"
        >
          <InputOTPGroup className="gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                // The stock slot is a 36px cell with a `border-input` hairline
                // (oklch 0.922) and no fill, joined into a segmented strip. On
                // this white page that is six empty squares outlined in an 8%
                // contrast step — effectively invisible, which is what it
                // looked like in practice. These are separate, larger boxes
                // borrowing the sign-in form's own idiom (white fill,
                // slate-200, rounded-xl) so the two screens match.
                className={cn(
                  "size-12 rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-900 shadow-sm sm:size-14",
                  // Beat the segmented-strip radii the base class sets on the
                  // first and last cell.
                  "first:rounded-l-xl last:rounded-r-xl",
                  "data-[active=true]:border-black data-[active=true]:ring-2 data-[active=true]:ring-black/20",
                )}
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

        {/* Deliberately the sign-in button's exact treatment: this is the
            second half of the same flow, and the default variant's
            disabled:opacity-50 on a near-black fill read as a washed-out grey
            slab that looked broken rather than "not ready yet". */}
        <Button
          type="button"
          onClick={submit}
          disabled={isPending || code.length < 6}
          className="h-auto w-full rounded-xl border-0 bg-black px-4 py-3 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:bg-neutral-800 disabled:opacity-40"
        >
          <ShieldCheck className="mr-2 size-5" />
          {isPending ? "Verifying…" : "Verify"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full rounded-xl text-slate-500 hover:text-slate-900"
        >
          Back to sign in
        </Button>
      </Box>
    </Box>
  );
}

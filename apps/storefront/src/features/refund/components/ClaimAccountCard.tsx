import React, { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, LogIn, UserPlus, Wallet } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { claimRegisterSchema, type ClaimRegisterFormValues } from "@/features/refund/schemas/refund.schema";
import { useAttachRefundAccount, useRegisterAndClaim } from "@/features/refund/hooks/useRefundClaim";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/lib/format";
import { normalizeWhatsappNumber, sanitizePhoneInput } from "@/lib/phone";

interface Props {
  token: string;
  amount: number;
  /** Masked contact from the order, so the customer knows which one to use. */
  contact: { email: string | null; phone: string | null };
  locale: string;
  onClaimed: () => void;
}

/**
 * The account step: the refund is paid as balance, so there has to be an
 * account to pay it into.
 *
 * Two ways in, and the second is not optional. Email and phone are unique, so a
 * customer who already has an account cannot register again — without the
 * sign-in path they would be holding a valid link they can do nothing with.
 *
 * The contact from the order is shown masked, because whoever holds this link
 * is still unauthenticated. It is there to answer "which of my emails did I
 * order with", not to hand the address to someone who intercepted the link.
 */
export default function ClaimAccountCard({ token, amount, contact, locale, onClaimed }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("refund");
  const signedIn = useAuthStore((state) => Boolean(state.token));
  const [mode, setMode] = useState<"register" | "signin">(signedIn ? "signin" : "register");

  const registerClaim = useRegisterAndClaim(token);
  const attach = useAttachRefundAccount(token);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClaimRegisterFormValues>({
    resolver: zodResolver(claimRegisterSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", password_confirmation: "" },
  });

  // The API's own message is surfaced verbatim: the useful failures here are
  // "that contact does not match the order" and "already claimed", and both are
  // decided server-side from data this page deliberately cannot see.
  const apiError =
    (registerClaim.error as { message?: string } | null)?.message ??
    (attach.error as { message?: string } | null)?.message ??
    null;

  const submitRegister = handleSubmit((values) =>
    registerClaim.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        // Submitted canonical, exactly as the sign-up form does. The API
        // normalises again at its own boundary; this is so the customer's
        // account carries the number they think they typed.
        phone: normalizeWhatsappNumber(values.phone),
        password: values.password,
        password_confirmation: values.password_confirmation,
      },
      { onSuccess: onClaimed },
    ),
  );

  const field = (name: keyof ClaimRegisterFormValues) =>
    errors[name] ? (
      <Text as="span" className="font-inter text-[12px] text-red-400">
        {t(errors[name]?.message ?? "")}
      </Text>
    ) : null;

  return (
    <Box className="rounded-2xl border border-[rgba(208,201,129,0.35)] bg-[rgb(14,20,10)] p-6 md:p-8 flex flex-col gap-5">
      <Box className="flex flex-col gap-1">
        <Text as="p" className="font-outfit font-semibold text-[15px] text-white">
          {t("account.heading", { amount: formatCurrency(amount, i18n.language) })}
        </Text>
        <Text as="p" className="font-inter text-[12px] text-white/55 leading-relaxed">
          {t("account.subtitle")}
        </Text>
      </Box>

      {/* Said plainly and up front: this is store credit, not cash back to a
          bank account. Burying it would be the kind of surprise that turns into
          a complaint after the money has already moved. */}
      <Box className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
        <Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <Text as="span" className="font-inter text-[12px] text-white/70 leading-relaxed">
          {t("account.balanceNotice")}
        </Text>
      </Box>

      {(contact.email || contact.phone) && (
        <Text as="p" className="font-inter text-[12px] text-white/45 leading-relaxed">
          {t("account.mustMatch", { contact: [contact.email, contact.phone].filter(Boolean).join(" · ") })}
        </Text>
      )}

      <Box className="flex gap-2">
        <Box
          as="button"
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-full py-2 px-4 font-outfit font-bold text-[12px] transition-colors ${
            mode === "register"
              ? "bg-[rgb(67,86,32)]/20 border border-[rgb(67,86,32)]/60 text-white"
              : "border border-white/10 text-white/55 hover:bg-white/5"
          }`}
        >
          {t("account.tabs.register")}
        </Box>
        <Box
          as="button"
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full py-2 px-4 font-outfit font-bold text-[12px] transition-colors ${
            mode === "signin"
              ? "bg-[rgb(67,86,32)]/20 border border-[rgb(67,86,32)]/60 text-white"
              : "border border-white/10 text-white/55 hover:bg-white/5"
          }`}
        >
          {t("account.tabs.signin")}
        </Box>
      </Box>

      {apiError && (
        <Box className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <Text as="span" className="font-inter text-[12px] text-white/75 leading-relaxed">
            {apiError}
          </Text>
        </Box>
      )}

      {mode === "register" ? (
        <Box
          as="form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void submitRegister();
          }}
          className="flex flex-col gap-4"
        >
          <Box className="flex flex-col gap-2">
            <Box as="label" htmlFor="claim-name" className="font-inter text-[13px] text-white/55">
              {t("account.fields.name")}
            </Box>
            <Input id="claim-name" {...register("name")} type="text" placeholder={t("account.fields.namePlaceholder")} />
            {field("name")}
          </Box>

          <Box className="flex flex-col gap-2">
            <Box as="label" htmlFor="claim-email" className="font-inter text-[13px] text-white/55">
              {t("account.fields.email")}
            </Box>
            <Input id="claim-email" {...register("email")} type="email" placeholder="email@contoh.com" />
            {field("email")}
          </Box>

          <Box className="flex flex-col gap-2">
            <Box as="label" htmlFor="claim-phone" className="font-inter text-[13px] text-white/55">
              {t("account.fields.phone")}
            </Box>
            <Input
              id="claim-phone"
              {...register("phone", {
                onChange: (e) => setValue("phone", sanitizePhoneInput(e.target.value), { shouldValidate: true }),
              })}
              type="tel"
              placeholder="08xxxxxxxxxx atau +65xxxxxxxx"
            />
            {field("phone")}
          </Box>

          <Box className="flex flex-col gap-2">
            <Box as="label" htmlFor="claim-password" className="font-inter text-[13px] text-white/55">
              {t("account.fields.password")}
            </Box>
            <PasswordInput
              id="claim-password"
              {...register("password")}
              placeholder="••••••"
              showLabel={t("account.fields.showPassword")}
              hideLabel={t("account.fields.hidePassword")}
            />
            {field("password")}
          </Box>

          <Box className="flex flex-col gap-2">
            <Box as="label" htmlFor="claim-password-confirm" className="font-inter text-[13px] text-white/55">
              {t("account.fields.passwordConfirmation")}
            </Box>
            <PasswordInput
              id="claim-password-confirm"
              {...register("password_confirmation")}
              placeholder="••••••"
              showLabel={t("account.fields.showPassword")}
              hideLabel={t("account.fields.hidePassword")}
            />
            {field("password_confirmation")}
          </Box>

          <Button
            type="submit"
            disabled={registerClaim.isPending}
            className="w-full flex items-center justify-center gap-2 py-3"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            {registerClaim.isPending ? t("account.submitting") : t("account.submitRegister")}
          </Button>
        </Box>
      ) : signedIn ? (
        <Box className="flex flex-col gap-3">
          <Text as="p" className="font-inter text-[12px] text-white/55 leading-relaxed">
            {t("account.signedInHelp")}
          </Text>
          <Button
            type="button"
            disabled={attach.isPending}
            onClick={() => attach.mutate(undefined, { onSuccess: onClaimed })}
            className="w-full flex items-center justify-center gap-2 py-3"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            {attach.isPending ? t("account.submitting") : t("account.submitAttach")}
          </Button>
        </Box>
      ) : (
        <Box className="flex flex-col gap-3">
          <Text as="p" className="font-inter text-[12px] text-white/55 leading-relaxed">
            {t("account.signInHelp")}
          </Text>
          {/* Back to this exact link after signing in, token and all — losing
              it here would mean asking for a resend to start over. */}
          <Link
            href={`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/refund?token=${token}`)}`}
            className="w-full flex items-center justify-center gap-2 rounded-[50px] border border-[rgb(67,86,32)]/60 bg-[rgb(67,86,32)]/10 py-3 px-4 font-outfit font-bold text-[13px] text-white hover:bg-[rgb(67,86,32)]/20 transition-colors"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {t("account.goToLogin")}
          </Link>
        </Box>
      )}
    </Box>
  );
}

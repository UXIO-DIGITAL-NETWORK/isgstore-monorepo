import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { GoogleLogin } from "@react-oauth/google";

import { Box } from "@/components/common/Box";
import { ErrorState } from "@/components/common/ErrorState";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";

import { ENV } from "@/config/env";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/useLogin";
import { useGoogleLogin } from "../hooks/useGoogleLogin";
import type { ApiError } from "@/types/api.type";

const inputClass =
  "w-full bg-white/6 border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[rgb(208,201,129)] focus:bg-white/8 transition-all";

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const { locale } = useParams({ strict: false }) as { locale: string };
  const { mutate: login, isPending, error } = useLogin();
  const googleLogin = useGoogleLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => login(data);

  // Surface an error from either the password or the Google path in the same banner.
  const apiError = (error ?? googleLogin.error) as
    | { response?: { data?: ApiError } }
    | null;
  const apiErrorMessage = apiError?.response?.data?.message;

  return (
    <Box className="w-full">
      {/* Header */}
      <Box className="mb-7">
        <Heading
          level={2}
          className="text-[28px] font-extrabold uppercase tracking-tight font-outfit text-white mb-3"
        >
          {t("login.title")}
        </Heading>
        <Text className="text-white/45 text-[13px] leading-relaxed">
          {t("login.subtitle")}
        </Text>
      </Box>

      {/* API Error */}
      {apiErrorMessage && (
        <Box className="mb-5">
          <ErrorState variant="inline" title={apiErrorMessage} description="" />
        </Box>
      )}

      <Box as="form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email/Username */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
            {t("login.email")}
            <Text as="span" className="text-red-500 ml-0.5">*</Text>
          </Text>
          <Box
            as="input"
            type="text"
            {...register("email")}
            placeholder={t("login.emailPlaceholder")}
            className={inputClass}
          />
          {errors.email && (
            <Text as="span" className="text-red-400 text-xs">{errors.email.message}</Text>
          )}
        </Box>

        {/* Password */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
            {t("login.password")}
            <Text as="span" className="text-red-500 ml-0.5">*</Text>
          </Text>
          <Box className="relative">
            <Box
              as="input"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder={t("login.passwordPlaceholder")}
              className={`${inputClass} pr-12`}
            />
            <Box
              as="button"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer border-0 bg-transparent"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </Box>
          </Box>
          {errors.password && (
            <Text as="span" className="text-red-400 text-xs">{errors.password.message}</Text>
          )}
        </Box>

        {/* Remember me + Forgot password */}
        <Box className="flex items-center justify-between pt-1">
          <Box className="flex items-center gap-2">
            <Box
              as="input"
              type="checkbox"
              id="remember"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue("remember", e.target.checked)
              }
              className="w-4 h-4 accent-[rgb(208,201,129)] cursor-pointer"
            />
            <Box as="label" htmlFor="remember" className="text-sm text-white/70 font-inter cursor-pointer select-none">
              {t("login.rememberMe")}
            </Box>
          </Box>
          <Link
            href={`/${locale ?? "id"}/forgot-password`}
            className="text-sm text-[rgb(208,201,129)] hover:text-[rgb(247,246,198)] transition-colors font-inter"
          >
            {t("login.forgotPassword")}
          </Link>
        </Box>

        {/* Submit */}
        <Box
          as="button"
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center py-3 px-4 bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] shadow-cta-primary text-white text-[15px] font-bold font-outfit rounded-full border-0 disabled:opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
        >
          {isPending ? t("login.loading") : t("login.submit")}
        </Box>
      </Box>

      {/* Divider */}
      <Box className="flex items-center gap-4 my-6">
        <Box className="h-px flex-1 bg-white/10" />
        <Text as="span" className="text-white/40 text-xs font-inter tracking-wider">
          {t("login.or")}
        </Text>
        <Box className="h-px flex-1 bg-white/10" />
      </Box>

      {/* Google Sign-In — official GIS button returns an ID token (credential)
          which the hook posts to /v1/auth/google. Rendered only when a Client ID
          is configured so it never shows up broken. */}
      {ENV.GOOGLE_CLIENT_ID && (
        <Box className="flex justify-center [color-scheme:light]">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                googleLogin.mutate(credentialResponse.credential);
              }
            }}
            onError={() => {
              // GIS-side failure (popup closed, network). The banner above
              // shows API-side failures; this keeps the UI from hanging.
            }}
            theme="filled_black"
            shape="pill"
            text="signin_with"
            width="320"
          />
        </Box>
      )}

      {/* Register link */}
      <Text className="block text-center text-sm text-white/50 mt-6">
        {t("login.noAccount")}{" "}
        <Link
          href={`/${locale ?? "id"}/register`}
          className="text-[rgb(208,201,129)] font-bold hover:underline transition-colors"
        >
          {t("login.registerLink")}
        </Link>
      </Text>
    </Box>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useParams } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";

import googleLogo from "@/assets/icons/google_logo.svg";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/useLogin";
import type { ApiError } from "@/types/api.type";

const inputClass =
  "w-full bg-white/6 border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#C084FC] focus:bg-white/8 transition-all";

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const { locale } = useParams({ strict: false }) as { locale: string };
  const { mutate: login, isPending, error } = useLogin();
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

  const apiError = error as { response?: { data?: ApiError } } | null;
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
        <Box className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl mb-5">
          <Text className="font-medium text-red-400 text-sm">{apiErrorMessage}</Text>
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
              className="w-4 h-4 accent-[#9234EA] cursor-pointer"
            />
            <Box as="label" htmlFor="remember" className="text-sm text-white/70 font-inter cursor-pointer select-none">
              {t("login.rememberMe")}
            </Box>
          </Box>
          <Box
            as="button"
            type="button"
            className="text-sm text-[#3B82F6] hover:text-[#60A5FA] transition-colors cursor-pointer border-0 bg-transparent font-inter"
          >
            {t("login.forgotPassword")}
          </Box>
        </Box>

        {/* Submit */}
        <Box
          as="button"
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center py-3 px-4 bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary text-white text-[15px] font-bold font-outfit rounded-full border-0 disabled:opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
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

      {/* Google Sign-In */}
      <Box
        as="button"
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-white/[0.04] border border-white/10 rounded-full py-3 text-white text-sm font-inter hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Box as="img" src={googleLogo} alt="Google" className="w-5 h-5" />
        {t("login.googleSignIn")}
      </Box>

      {/* Register link */}
      <Text className="block text-center text-sm text-white/50 mt-6">
        {t("login.noAccount")}{" "}
        <Link
          href={`/${locale ?? "id"}/register`}
          className="text-[#3B82F6] font-bold hover:underline transition-colors"
        >
          {t("login.registerLink")}
        </Link>
      </Text>
    </Box>
  );
}

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
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schema";
import { useRegister } from "../hooks/useRegister";
import type { ApiError } from "@/types/api.type";
import { normalizeWhatsappNumber, toNationalPhone } from "@/lib/phone";

const inputClass =
  "w-full bg-white/6 border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#C084FC] focus:bg-white/8 transition-all";

export default function RegisterPage() {
  const { t } = useTranslation("auth");
  const { locale } = useParams({ strict: false }) as { locale: string };
  const { mutate: registerUser, isPending, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) =>
    registerUser({ ...data, phone: normalizeWhatsappNumber(data.phone) });

  const apiError = error as { response?: { data?: ApiError } } | null;
  const apiErrorMessage = apiError?.response?.data?.message;

  return (
    <Box className="w-full">
      {/* Header */}
      <Box className="mb-6">
        <Heading
          level={2}
          className="text-[28px] font-extrabold uppercase tracking-tight font-outfit text-white mb-2"
        >
          {t("register.title")}
        </Heading>
        <Text className="text-white/45 text-[13px] leading-relaxed">
          {t("register.subtitle")}
        </Text>
      </Box>

      {/* API Error */}
      {apiErrorMessage && (
        <Box className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl mb-5">
          <Text className="font-medium text-red-400 text-sm">{apiErrorMessage}</Text>
        </Box>
      )}

      <Box as="form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row: Name + Username */}
        <Box className="grid grid-cols-2 gap-3">
          <Box className="space-y-2">
            <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
              {t("register.name")}
            </Text>
            <Box
              as="input"
              type="text"
              {...register("name")}
              placeholder={t("register.namePlaceholder")}
              className={inputClass}
            />
            {errors.name && (
              <Text as="span" className="text-red-400 text-xs">{errors.name.message}</Text>
            )}
          </Box>
          <Box className="space-y-2">
            <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
              {t("register.username")}
            </Text>
            <Box
              as="input"
              type="text"
              {...register("username")}
              placeholder={t("register.usernamePlaceholder")}
              className={inputClass}
            />
            {errors.username && (
              <Text as="span" className="text-red-400 text-xs">{errors.username.message}</Text>
            )}
          </Box>
        </Box>

        {/* Email */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
            {t("register.email")}
          </Text>
          <Box
            as="input"
            type="email"
            {...register("email")}
            placeholder={t("register.emailPlaceholder")}
            className={inputClass}
          />
          {errors.email && (
            <Text as="span" className="text-red-400 text-xs">{errors.email.message}</Text>
          )}
        </Box>

        {/* Phone */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
            {t("register.phone")}
          </Text>
          <Box className="flex w-full bg-white/6 border border-white/10 rounded-full focus-within:border-[#C084FC] focus-within:bg-white/8 transition-all overflow-hidden">
            <Text
              as="span"
              className="flex items-center px-5 py-3 text-white/60 border-r border-white/10 flex-shrink-0 select-none text-sm font-inter"
            >
              +62
            </Text>
            <Box
              as="input"
              type="tel"
              {...register("phone", {
                onChange: (e) =>
                  setValue("phone", toNationalPhone(e.target.value), { shouldValidate: true }),
              })}
              placeholder={t("register.phonePlaceholder")}
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-white/30 text-sm font-inter outline-none"
            />
          </Box>
          {errors.phone && (
            <Text as="span" className="text-red-400 text-xs">{errors.phone.message}</Text>
          )}
        </Box>

        {/* Password */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
            {t("register.password")}
          </Text>
          <Box className="relative">
            <Box
              as="input"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder={t("register.passwordPlaceholder")}
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

        {/* Confirm Password */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
            {t("register.passwordConfirm")}
          </Text>
          <Box className="relative">
            <Box
              as="input"
              type={showConfirmPassword ? "text" : "password"}
              {...register("password_confirmation")}
              placeholder={t("register.passwordConfirmPlaceholder")}
              className={`${inputClass} pr-12`}
            />
            <Box
              as="button"
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer border-0 bg-transparent"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </Box>
          </Box>
          {errors.password_confirmation && (
            <Text as="span" className="text-red-400 text-xs">
              {errors.password_confirmation.message}
            </Text>
          )}
        </Box>

        {/* Terms checkbox */}
        <Box className="flex items-start gap-2 pt-1">
          <Box
            as="input"
            type="checkbox"
            id="terms"
            className="w-4 h-4 accent-[#9234EA] cursor-pointer mt-0.5 flex-shrink-0"
          />
          <Box
            as="label"
            htmlFor="terms"
            className="text-sm text-white/70 font-inter cursor-pointer leading-relaxed"
          >
            {t("register.termsPrefix")}{" "}
            <Text as="span" className="text-white underline hover:opacity-80 transition-opacity cursor-pointer">
              {t("register.termsLink")}
            </Text>{" "}
            {t("register.termsAnd")}{" "}
            <Text as="span" className="text-white underline hover:opacity-80 transition-opacity cursor-pointer">
              {t("register.privacyLink")}
            </Text>
            .
          </Box>
        </Box>

        {/* Submit */}
        <Box
          as="button"
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center py-3 px-4 bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary text-white text-[15px] font-bold font-outfit rounded-full border-0 disabled:opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
        >
          {isPending ? t("register.loading") : t("register.submit")}
        </Box>
      </Box>

      {/* Divider */}
      <Box className="flex items-center gap-4 my-5">
        <Box className="h-px flex-1 bg-white/10" />
        <Text as="span" className="text-white/40 text-xs font-inter tracking-wider">
          {t("register.or")}
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
        {t("register.googleSignIn")}
      </Box>

      {/* Login link */}
      <Text className="block text-center text-sm text-white/50 mt-5">
        {t("register.hasAccount")}{" "}
        <Link
          href={`/${locale ?? "id"}/login`}
          className="text-[#3B82F6] font-bold hover:underline transition-colors"
        >
          {t("register.loginLink")}
        </Link>
      </Text>
    </Box>
  );
}

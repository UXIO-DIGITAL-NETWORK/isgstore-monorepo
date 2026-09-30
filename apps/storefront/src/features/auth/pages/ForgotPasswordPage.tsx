import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { ErrorState } from "@/components/common/ErrorState";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";

import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas/auth.schema";
import { useForgotPassword } from "../hooks/useForgotPassword";
import type { ApiError } from "@/types/api.type";

const inputClass =
  "w-full bg-white/6 border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[rgb(208,201,129)] focus:bg-white/8 transition-all";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const { locale } = useParams({ strict: false }) as { locale: string };
  const { mutate: forgotPassword, isPending, isSuccess, error } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormValues) => forgotPassword(data);

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
          {t("forgotPassword.title")}
        </Heading>
        <Text className="text-white/45 text-[13px] leading-relaxed">
          {t("forgotPassword.subtitle")}
        </Text>
      </Box>

      {/* API Error */}
      {apiErrorMessage && (
        <Box className="mb-5">
          <ErrorState variant="inline" title={apiErrorMessage} description="" />
        </Box>
      )}

      {/* Success message */}
      {isSuccess && (
        <Box className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl mb-5">
          <Text className="font-medium text-green-400 text-sm">
            {t("forgotPassword.successMessage")}
          </Text>
        </Box>
      )}

      <Box as="form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-semibold text-white/80 font-outfit">
            {t("forgotPassword.email")}
            <Text as="span" className="text-red-500 ml-0.5">*</Text>
          </Text>
          <Box
            as="input"
            type="text"
            {...register("email")}
            placeholder={t("forgotPassword.emailPlaceholder")}
            className={inputClass}
          />
          {errors.email && (
            <Text as="span" className="text-red-400 text-xs">{errors.email.message}</Text>
          )}
        </Box>

        {/* Submit */}
        <Box
          as="button"
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center py-3 px-4 bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] shadow-cta-primary text-white text-[15px] font-bold font-outfit rounded-full border-0 disabled:opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
        >
          {isPending ? t("forgotPassword.loading") : t("forgotPassword.submit")}
        </Box>
      </Box>

      {/* Back to login */}
      <Text className="block text-center text-sm text-white/50 mt-6">
        <Link
          href={`/${locale ?? "id"}/login`}
          className="text-[rgb(208,201,129)] font-bold hover:underline transition-colors"
        >
          {t("forgotPassword.backToLogin")}
        </Link>
      </Text>
    </Box>
  );
}

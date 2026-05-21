import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ArrowRight } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";

import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/useLogin";
import type { ApiError } from "@/types/api.type";

const inputClass =
  "w-full bg-white/6 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#C084FC] focus:bg-white/8 transition-all";

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const { mutate: login, isPending, error } = useLogin();

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
    <Box className="w-full max-w-[420px]">
      <Box className="mb-10">
        <Heading level={2} className="text-[32px] font-extrabold text-white mb-4 tracking-tight font-outfit">
          {t("login.title")}
        </Heading>
        <Text className="text-white/60 text-[15px]">{t("login.subtitle")}</Text>
      </Box>

      {apiErrorMessage && (
        <Box className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6">
          <Text className="font-medium text-red-400 text-sm">{apiErrorMessage}</Text>
        </Box>
      )}

      <Box as="form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-bold text-white/80 font-outfit">{t("login.email")}</Text>
          <Box className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Box as="input" type="email" {...register("email")} placeholder="you@example.com" className={inputClass} />
          </Box>
          {errors.email && <Text as="span" className="text-red-400 text-xs">{errors.email.message}</Text>}
        </Box>

        {/* Password */}
        <Box className="space-y-2">
          <Text as="span" className="block text-sm font-bold text-white/80 font-outfit">{t("login.password")}</Text>
          <Box className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Box as="input" type="password" {...register("password")} placeholder="••••••••" className={inputClass} />
          </Box>
          {errors.password && <Text as="span" className="text-red-400 text-xs">{errors.password.message}</Text>}
        </Box>

        {/* Remember me */}
        <Box className="flex items-center gap-2 pt-1">
          <Box
            as="input"
            type="checkbox"
            id="remember"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue("remember", e.target.checked)}
            className="w-4 h-4 accent-[#9234EA] cursor-pointer"
          />
          <Text as="span" className="text-sm text-white/70 font-inter cursor-pointer">
            <Box as="label" htmlFor="remember">{t("login.rememberMe")}</Box>
          </Text>
        </Box>

        {/* Submit */}
        <Box className="pt-4">
          <Box
            as="button"
            type="submit"
            disabled={isPending}
            className="w-full h-auto flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary text-white text-[15px] font-bold font-outfit rounded-xl border-0 disabled:opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {isPending ? t("login.loading") : t("login.submit")}
            {!isPending && <ArrowRight className="w-5 h-5" />}
          </Box>
        </Box>
      </Box>

      <Text className="block text-center text-sm text-white/50 mt-8">
        {t("login.noAccount")}{" "}
        <Link href="/id/register" className="text-[#9234EA] font-bold hover:underline transition-colors">
          {t("login.registerLink")}
        </Link>
      </Text>
    </Box>
  );
}

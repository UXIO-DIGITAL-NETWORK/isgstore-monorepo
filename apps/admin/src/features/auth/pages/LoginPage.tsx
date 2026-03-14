import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/useLogin";
import type { AuthApiError } from "../types/auth.type";

export default function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  // Catch API Error Message (Example: Invalid credentials)
  const apiErrorMessage = (error as unknown as AuthApiError)?.response?.data?.message;

  return (
    <Box className="w-full max-w-[420px]">
      {/* Header */}
      <Box className="mb-10">
        <Heading
          level={2}
          className="text-[32px] font-extrabold text-slate-900 mb-4 tracking-tight"
        >
          Selamat Datang
        </Heading>
        <Text className="text-slate-500 text-[15px] font-medium">
          Silahkan masukkan detail akun Anda untuk mengakses sistem.
        </Text>
      </Box>

      {/* Global Error Alert */}
      {apiErrorMessage && (
        <Box className="bg-red-50 p-4 rounded-xl mb-6 shadow-sm border border-red-100">
          <Text className="font-medium text-red-600 text-sm">{apiErrorMessage}</Text>
        </Box>
      )}

      {/* Form */}
      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Email Input */}
        <Box className="space-y-2">
          <Label
            htmlFor="email"
            className="block text-sm font-bold text-slate-800"
          >
            Email
          </Label>
          <Box className="relative">
            <Box className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-slate-400" />
            </Box>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="you@company.com"
              className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
            />
          </Box>
          {errors.email && <Text className="text-red-500 text-xs font-medium">{errors.email.message}</Text>}
        </Box>

        {/* Password Input */}
        <Box className="space-y-2">
          <Label
            htmlFor="password"
            className="block text-sm font-bold text-slate-800"
          >
            Password
          </Label>
          <Box className="relative">
            <Box className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-slate-400" />
            </Box>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
            />
          </Box>
          {errors.password && <Text className="text-red-500 text-xs font-medium">{errors.password.message}</Text>}
        </Box>

        {/* Options */}
        <Box className="flex items-center justify-between pt-1">
          <Box className="flex items-center space-x-2.5 group">
            <Checkbox
              id="remember"
              onCheckedChange={(checked) => setValue("remember", checked as boolean)}
              className="w-5 h-5 bg-white border-slate-300 rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600 focus-visible:ring-blue-600/20"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-semibold text-slate-700 cursor-pointer"
            >
              Ingat saya
            </Label>
          </Box>
        </Box>

        {/* Submit Button */}
        <Box className="pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-auto flex items-center justify-center py-3 px-4 bg-linear-to-r from-blue-600 to-blue-500 hover:to-blue-600 text-white text-[15px] font-bold rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] border-0 disabled:opacity-70"
          >
            {isPending ? "Memproses..." : "Masuk ke Sistem"}
            {!isPending && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </Box>
      </Box>

      <Text className="block text-center text-sm text-slate-500 mt-8 font-medium">
        Belum memiliki akun?{" "}
        <Link
          to="/register"
          className="text-blue-600 font-bold hover:underline transition-colors"
        >
          Daftar sekarang
        </Link>
      </Text>
    </Box>
  );
}

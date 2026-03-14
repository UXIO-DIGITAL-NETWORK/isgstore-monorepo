import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { registerSchema, type RegisterFormValues } from "../schemas/auth.schema";
import { useRegister } from "../hooks/useRegister";
import type { AuthApiError } from "../types/auth.type";

export default function RegisterPage() {
  const { mutate: registerUser, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerUser(data);
  };

  // Catch API Error Message (Example: Email already used)
  const apiErrorMessage = (error as unknown as AuthApiError)?.response?.data?.message;

  return (
    <Box className="w-full max-w-[420px]">
      {/* Header */}
      <Box className="mb-10">
        <Heading
          level={2}
          className="text-[32px] font-extrabold text-slate-900 mb-4 tracking-tight"
        >
          Buat Akun Baru
        </Heading>
        <Text className="text-slate-500 text-[15px] font-medium">
          Daftar untuk mulai menggunakan sistem React Enterprise Boilerplate.
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
        {/* Name Input */}
        <Box className="space-y-2">
          <Label
            htmlFor="name"
            className="block text-sm font-bold text-slate-800"
          >
            Nama Lengkap
          </Label>
          <Box className="relative">
            <Box className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <UserIcon className="w-5 h-5 text-slate-400" />
            </Box>
            <Input
              id="name"
              type="text"
              {...register("name")}
              placeholder="Contoh: John Doe"
              className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
            />
          </Box>
          {errors.name && <Text className="text-red-500 text-xs font-medium">{errors.name.message}</Text>}
        </Box>

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
              placeholder="Contoh: you@company.com"
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

        {/* Password Confirmation Input */}
        <Box className="space-y-2">
          <Label
            htmlFor="password_confirmation"
            className="block text-sm font-bold text-slate-800"
          >
            Konfirmasi Password
          </Label>
          <Box className="relative">
            <Box className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-slate-400" />
            </Box>
            <Input
              id="password_confirmation"
              type="password"
              {...register("password_confirmation")}
              placeholder="••••••••"
              className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
            />
          </Box>
          {errors.password_confirmation && (
            <Text className="text-red-500 text-xs font-medium">{errors.password_confirmation.message}</Text>
          )}
        </Box>

        {/* Submit Button */}
        <Box className="pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-auto flex items-center justify-center py-3 px-4 bg-linear-to-r from-blue-600 to-blue-500 hover:to-blue-600 text-white text-[15px] font-bold rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] border-0 disabled:opacity-70"
          >
            {isPending ? "Memproses..." : "Mulai Perjalanan Anda"}
            {!isPending && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </Box>
      </Box>

      <Text className="block text-center text-sm text-slate-500 mt-8 font-medium">
        Sudah memiliki akun?{" "}
        <Link
          to="/login"
          className="text-blue-600 font-bold hover:underline transition-colors"
        >
          Masuk
        </Link>
      </Text>
    </Box>
  );
}

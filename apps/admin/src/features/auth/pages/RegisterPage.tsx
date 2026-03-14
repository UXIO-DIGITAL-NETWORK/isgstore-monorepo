import { Link } from "@tanstack/react-router";
import { Zap, Mail, Lock, ArrowRight, User } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <Box className="min-h-screen flex antialiased font-sans bg-white text-slate-900">
      <Box className="flex min-h-screen w-full">
        {/* ================= LEFT SIDE: 60% GRADIENT CONTAINER ================= */}
        <Box className="hidden lg:flex w-[60%] flex-col relative px-16 py-12 justify-center text-white overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-blue-950">
          {/* Logo Section */}
          <Box className="absolute top-12 left-16 flex items-center space-x-3">
            <Zap className="w-8 h-8 text-blue-400 drop-shadow-md" />
            <Link to="/">
              <Text className="text-xl text-white font-bold tracking-tight drop-shadow-md">React Enterprise</Text>
            </Link>
          </Box>

          {/* Content Section */}
          <Box className="relative z-10 w-full max-w-2xl mt-8">
            {/* Badge */}
            <Box className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md rounded-full px-4 py-1.5 mb-8 border border-white/10 shadow-sm">
              <Box className="w-2.5 h-2.5 rounded-full bg-blue-500"></Box>
              <Text className="text-xs font-semibold tracking-wide text-slate-300">
                Boilerplate React Skala Enterprise
              </Text>
            </Box>

            {/* Headline */}
            <Heading
              level={1}
              className="text-[64px] leading-[1.05] text-white font-extrabold tracking-tight mb-8"
            >
              Bangun Aplikasi Lebih Cepat
              <Box as="br" />
              <Text
                as="span"
                className="text-blue-400 text-[64px] font-extrabold"
              >
                Skalabilitas Tanpa Batas.
              </Text>
            </Heading>

            {/* Slogan Subheadline */}
            <Text className="text-[17px] font-medium text-slate-300 leading-relaxed max-w-md mb-8">
              Fondasi yang kuat, type-safe, dan performa tinggi untuk proyek React Anda berikutnya.
            </Text>
          </Box>

          {/* Footer Section */}
          <Box className="absolute bottom-12 left-16">
            <Text className="text-slate-500 text-xs font-medium font-mono tracking-wide">
              © 2026 React Enterprise Boilerplate.
            </Text>
          </Box>
        </Box>

        {/* ================= RIGHT SIDE: 40% FORM CONTAINER ================= */}
        <Box className="w-full lg:w-[40%] flex items-center justify-center p-8 lg:p-12 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-20">
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

            {/* DUMMY FORM - Menggunakan Shadcn UI (Tanpa !important) */}
            <Box
              as="form"
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
                    <User className="w-5 h-5 text-slate-400" />
                  </Box>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Contoh: John Doe"
                    className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 shadow-sm placeholder:text-slate-400 text-slate-900 font-medium"
                  />
                </Box>
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
                    placeholder="Contoh: you@company.com"
                    className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 shadow-sm placeholder:text-slate-400 text-slate-900 font-medium"
                  />
                </Box>
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
                    placeholder="••••••••"
                    className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 shadow-sm placeholder:text-slate-400 text-slate-900 font-medium"
                  />
                </Box>
              </Box>

              {/* Password Confirmation Input */}
              <Box className="space-y-2">
                <Label
                  htmlFor="password"
                  className="block text-sm font-bold text-slate-800"
                >
                  Konfirmasi Password
                </Label>
                <Box className="relative">
                  <Box className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </Box>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-auto pl-10 pr-4 py-2.5 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 shadow-sm placeholder:text-slate-400 text-slate-900 font-medium"
                  />
                </Box>
              </Box>

              {/* Submit Button (Elevated) */}
              <Box className="pt-4">
                <Button
                  type="button"
                  className="w-full h-auto flex items-center justify-center py-3 px-4 bg-linear-to-r from-blue-600 to-blue-500 hover:to-blue-600 text-white text-[15px] font-bold rounded-xl hover:opacity-90 transition-all duration-300 shadow-[0_8px_20px_rgba(37,99,235,0.25)] group border-0"
                >
                  Mulai Perjalanan Anda
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
        </Box>
      </Box>
    </Box>
  );
}

import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { AuthSideHero } from "../components/AuthSideHero";

export function AuthLayout() {
  return (
    <Box className="min-h-screen flex antialiased font-sans bg-white text-slate-900">
      <Box className="flex min-h-screen w-full">
        <AuthSideHero />

        <Box className="w-full lg:w-[40%] flex items-center justify-center p-8 lg:p-12 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-20">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

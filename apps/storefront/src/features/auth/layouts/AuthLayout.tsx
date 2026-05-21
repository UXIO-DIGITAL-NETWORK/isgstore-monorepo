import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { AuthSideHero } from "../components/AuthSideHero";

export function AuthLayout() {
  return (
    <Box className="min-h-screen flex antialiased font-inter bg-[#0A0A0C] text-white">
      <Box className="flex min-h-screen w-full">
        <AuthSideHero />
        <Box className="w-full lg:w-[40%] flex items-center justify-center p-8 lg:p-12 bg-white/3 border-l border-white/8 z-20">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

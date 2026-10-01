import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import authBanner from "@/assets/images/banner/auth_banner.png";

export function AuthLayout() {
  return (
    <Box className="min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-[rgb(0,0,0)] to-[#050631] font-inter text-white">
      <Box className="w-full max-w-[1100px] flex rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
        {/* Left — banner image */}
        <Box className="hidden md:block md:w-[44%] self-stretch">
          <Box
            as="img"
            src={authBanner}
            alt=""
            className="h-full w-full object-cover"
          />
        </Box>

        {/* Right — form outlet */}
        <Box className="w-full md:w-[56%] flex items-center justify-center p-8 lg:p-10">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

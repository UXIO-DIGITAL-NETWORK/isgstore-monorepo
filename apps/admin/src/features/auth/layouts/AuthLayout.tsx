import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { AuthSideHero } from "../components/AuthSideHero";

export function AuthLayout() {
  return (
    // `auth-surface` pins this shell to the light palette (see index.css): the
    // panel is white whatever theme the app is in, so token-based children —
    // the 2FA enrolment card and its labels — must render light-mode colours or
    // they come out invisible against it.
    <Box className="auth-surface min-h-screen flex antialiased font-sans bg-white text-slate-900">
      <Box className="flex min-h-screen w-full">
        <AuthSideHero />

        <Box className="w-full lg:w-[40%] flex items-center justify-center p-8 lg:p-12 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-20">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

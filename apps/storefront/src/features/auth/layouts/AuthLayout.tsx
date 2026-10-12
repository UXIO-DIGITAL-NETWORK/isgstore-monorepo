import { Outlet } from "@tanstack/react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Box } from "@/components/common/Box";
import { ENV } from "@/config/env";
import authBanner from "@/assets/images/banner/auth_banner.png?w=1200&format=webp";

export function AuthLayout() {
  // Google Identity Services is scoped to the auth subtree: it injects
  // accounts.google.com/gsi/client, which the homepage has no use for. The
  // login/register pages are the only consumers of GoogleLogin/useGoogleLogin.
  return (
    <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID}>
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
    </GoogleOAuthProvider>
  );
}

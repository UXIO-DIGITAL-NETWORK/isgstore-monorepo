import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import { IMAGES } from "@/constants/images";
import { HeroSection, FeatureCards } from "../components";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";

import { useAuthStore } from "@/store/useAuthStore";
import { useLogout } from "@/features/auth/hooks/useLogout";

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();

  return (
    <Box className="relative min-h-screen bg-background overflow-hidden selection:bg-primary/30 flex flex-col items-center justify-center p-6 lg:p-12">
      {/* Top-left Blue gradient blob */}
      <Box className="absolute top-0 left-0 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <Box className="relative flex items-center justify-between w-full max-w-6xl mx-auto mb-12">
        <Box className="flex items-center gap-2">
          <Image
            src={IMAGES.REACT_LOGO}
            alt="React Logo"
            className="w-12 h-12 lg:w-16 lg:h-16 animate-spin-slow"
            style={{ animationDuration: "20s" }}
          />
        </Box>
        <Box className="flex items-center gap-4">
          <ThemeToggle />

          {/* LOGIKA KONDISIONAL TOMBOL AUTENTIKASI */}
          {token ? (
            <React.Fragment>
              <Button
                variant="ghost"
                className="font-semibold px-4"
                onPress={() => navigate({ to: "/" })}
              >
                Dashboard
              </Button>
              <Button
                variant="danger"
                className="font-semibold px-6"
                onPress={() => logout()}
                isDisabled={isPending}
              >
                {isPending ? "Keluar..." : "Logout"}
              </Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button
                variant="ghost"
                className="font-semibold px-4"
                onPress={() => navigate({ to: "/login" })}
              >
                Log in
              </Button>
              <Button
                variant="outline"
                className="font-semibold px-6"
                onPress={() => navigate({ to: "/register" })}
              >
                Register
              </Button>
            </React.Fragment>
          )}
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box className="relative w-full max-w-6xl mx-auto">
        <Box className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <HeroSection />
          <FeatureCards />
        </Box>

        {/* Bottom Version Text */}
        <Box className="mt-12 text-center">
          <Text className="text-sm text-muted-foreground font-medium">
            React Enterprise Boilerplate v1.0.0 (React v19)
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

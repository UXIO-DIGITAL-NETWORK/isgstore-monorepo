import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { HeroSection, FeatureCards } from "../components";
import { Navbar } from "@/components/shared/Navbar";

export default function HomePage(): React.JSX.Element {
  return (
    <Box className="relative min-h-screen bg-[#0B0A11] overflow-hidden selection:bg-primary/30 flex flex-col">
      <Navbar />

      <Box className="relative flex flex-col items-center justify-center p-6 lg:p-12 flex-1">
        {/* Top-left Blue gradient blob */}
        <Box className="absolute top-0 left-0 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Main Content Grid */}
        <Box className="relative w-full max-w-6xl mx-auto z-10">
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
    </Box>
  );
}

import React from "react";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import MagicWheelHero from "@/features/magic-wheel/components/MagicWheelHero";
import MagicWheelCalculator from "@/features/magic-wheel/components/MagicWheelCalculator";
import { useMagicWheel } from "@/features/magic-wheel/hooks/useMagicWheel";

export default function MagicWheelPage(): React.JSX.Element {
  const { magicPoints, setMagicPoints, diamonds } = useMagicWheel();

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />
      <Box className="max-w-[680px] mx-auto px-4 pb-20">
        <MagicWheelHero />
        <MagicWheelCalculator
          magicPoints={magicPoints}
          setMagicPoints={setMagicPoints}
          diamonds={diamonds}
        />
      </Box>
      <Footer />
    </Box>
  );
}

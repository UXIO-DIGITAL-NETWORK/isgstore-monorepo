import React from "react";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import ZodiacHero from "@/features/zodiac/components/ZodiacHero";
import ZodiacCalculator from "@/features/zodiac/components/ZodiacCalculator";
import { useZodiac } from "@/features/zodiac/hooks/useZodiac";

export default function ZodiacPage(): React.JSX.Element {
  const { starPower, setStarPower, diamonds } = useZodiac();

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />
      <Box className="max-w-[680px] mx-auto px-4 pb-20">
        <ZodiacHero />
        <ZodiacCalculator
          starPower={starPower}
          setStarPower={setStarPower}
          diamonds={diamonds}
        />
      </Box>
      <Footer />
    </Box>
  );
}

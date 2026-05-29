import React from "react";
import { Box } from "@/components/common/Box";
import { HeroBanner, FlashSale, PopularGames, TopUpGame, Keunggulan } from "../components";
import { Navbar } from "@/components/shared/Navbar";

export default function HomePage(): React.JSX.Element {
  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />
      <HeroBanner />
      <FlashSale />
      <PopularGames />
      <TopUpGame />
      <Keunggulan />
    </Box>
  );
}

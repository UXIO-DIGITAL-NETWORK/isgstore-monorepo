import React from "react";
import { Box } from "@/components/common/Box";
import { PublicHeader } from "@/components/layouts/PublicHeader";
import { HeroBanner, FlashSale, PopularGames } from "../components";

export default function HomePage(): React.JSX.Element {
  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <PublicHeader />
      <HeroBanner />
      <FlashSale />
      <PopularGames />
    </Box>
  );
}

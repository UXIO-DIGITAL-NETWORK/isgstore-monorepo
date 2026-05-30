import React from "react";
import { Box } from "@/components/common/Box";
import { HeroBanner, FlashSale, PopularGames, TopUpGame, Keunggulan, ArtikelTerbaru, CtaBanner } from "../components";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export default function HomePage(): React.JSX.Element {
  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />
      <HeroBanner />
      <FlashSale />
      <PopularGames />
      <TopUpGame />
      <Keunggulan />
      <ArtikelTerbaru />
      <CtaBanner />
      <Footer />
    </Box>
  );
}

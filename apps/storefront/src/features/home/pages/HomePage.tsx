import React from "react";
import { Box } from "@/components/common/Box";
import {
  HeroBanner,
  AnnouncementStrip,
  FlashSale,
  PopularGames,
  TopUpGame,
  Keunggulan,
  ArtikelTerbaru,
  Testimoni,
  CtaBanner,
} from "../components";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export default function HomePage(): React.JSX.Element {
  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />
      {/* Above the hero: a maintenance notice is worth more than the artwork. */}
      <AnnouncementStrip />
      <HeroBanner />
      <FlashSale />
      <PopularGames />
      <TopUpGame />
      <Keunggulan />
      <ArtikelTerbaru />
      {/* Social proof sits directly before the sign-up prompt. */}
      <Testimoni />
      <CtaBanner />
      <Footer />
    </Box>
  );
}

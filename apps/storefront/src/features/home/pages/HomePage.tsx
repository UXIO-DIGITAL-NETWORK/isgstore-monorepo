import React from "react";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { HeroBanner } from "../components";

export default function HomePage(): React.JSX.Element {
  return (
    <Box className="min-h-dvh bg-[#0B0A11]">
      <Navbar />
      <HeroBanner />
    </Box>
  );
}

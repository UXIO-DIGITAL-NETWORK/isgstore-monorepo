import React from "react";
import { Box } from "@/components/common/Box";
import { Image } from "@/components/common/Image";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import FaqHeader from "@/features/faq/components/FaqHeader";
import FaqAccordion from "@/features/faq/components/FaqAccordion";
import FaqContactBanner from "@/features/faq/components/FaqContactBanner";
import imgFaq from "@/assets/images/decoration/img_faq.png";

export default function FaqPage(): React.JSX.Element {
  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-20">
        {/* Header: flanked title + subtitle */}
        <FaqHeader />

        {/* Two-column: accordion (left) + illustration (right) */}
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: accordion */}
          <FaqAccordion />

          {/* Right: FAQ illustration */}
          <Box className="flex justify-center">
            <Image
              src={imgFaq}
              alt=""
              priority="eager"
              objectFit="contain"
              className="w-full max-w-[460px]"
            />
          </Box>
        </Box>

        {/* Bottom contact banner */}
        <Box className="mt-16">
          <FaqContactBanner />
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}

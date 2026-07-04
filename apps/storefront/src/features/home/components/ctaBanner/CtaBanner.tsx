import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import { Link } from "@/components/common/Link";
import ctaBg from "@/assets/images/CTA/CTA_1.png";
import ctaMascot from "@/assets/images/CTA/CTA_2.png";

export default function CtaBanner(): React.JSX.Element {
  const { t } = useTranslation("home");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  return (
    <Box as="section" className="relative w-full h-auto md:h-135.25 overflow-hidden">

      {/* Layer 1 — Full-bleed background */}
      <Image
        src={ctaBg}
        alt=""
        aria-hidden
        priority="eager"
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />

      {/* Max-width content container */}
      <Box className="relative h-full max-w-6xl mx-auto px-4 md:px-8">

        {/* Mobile: flex-col (mascot → text); Desktop: flex-row centered, mascot absolute */}
        <Box className="flex flex-col items-center text-center py-10 md:py-0 md:block md:h-full">

          {/* Mascot — flow element on mobile, absolute on desktop */}
          <Image
            src={ctaMascot}
            alt={t("cta.mascotAlt")}
            priority="eager"
            objectFit="contain"
            className="w-52 sm:w-64 md:absolute md:right-0 md:bottom-0 md:w-150 md:h-full mb-6 md:mb-0"
          />

          {/* Text + CTA — centered on mobile, left-aligned vertically centered on desktop */}
          <Box className="md:h-full md:flex md:items-center">
            <Box className="flex flex-col gap-5 md:gap-6 max-w-150 items-center md:items-start text-center md:text-left">
              <Heading
                as="h2"
                level={1}
                className="font-outfit font-bold text-[30px] sm:text-[40px] md:text-[52px] leading-[1.1] tracking-[-0.5px] md:tracking-[-1.5px] text-white"
              >
                {t("cta.title")}
              </Heading>

              <Text
                as="p"
                className="font-inter font-normal text-[15px] md:text-[16px] leading-[1.6] text-white/60"
              >
                {t("cta.subtitle")}
              </Text>

              <Box className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                  href={`/${locale}/register`}
                  className="h-13 md:h-16.5 px-8 md:px-10 rounded-full bg-white font-inter font-bold text-[16px] md:text-[18px] text-[#0A0A0C] cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center"
                >
                  {t("cta.register")}
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="h-13 md:h-16.5 px-8 rounded-full bg-white/10 border border-white/30 font-inter font-bold text-[16px] md:text-[18px] text-white backdrop-blur-sm cursor-pointer hover:bg-white/15 transition-colors whitespace-nowrap flex items-center justify-center"
                >
                  {t("cta.login")}
                </Link>
              </Box>
            </Box>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import iconWinRate from "@/assets/images/decoration/icon_win_rate.png";

export default function KalkulatorHero(): React.JSX.Element {
  const { t } = useTranslation("kalkulator");

  return (
    <Box className="flex flex-col items-center gap-4 pt-12 pb-8 text-center">
      {/* ── Icon ── */}
      <Image
        src={iconWinRate}
        alt="Win Rate Calculator Icon"
        priority="eager"
        objectFit="contain"
        className="w-24 h-24"
      />

      {/* ── Title ── */}
      <Box
        as="h1"
        className="font-outfit font-bold text-[32px] md:text-[42px] text-white uppercase tracking-wide leading-tight text-center"
      >
        {t("hero.title")}
      </Box>

      {/* ── Subtitle ── */}
      <Text
        as="p"
        className="font-inter text-[15px] text-[#697282] leading-snug max-w-lg"
      >
        {t("hero.subtitle")}
      </Text>
    </Box>
  );
}

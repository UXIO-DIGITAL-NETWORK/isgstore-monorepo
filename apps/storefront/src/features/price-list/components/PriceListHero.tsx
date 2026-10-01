import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

export default function PriceListHero(): React.JSX.Element {
  const { t } = useTranslation("priceList");

  return (
    <Box className="flex flex-col items-center gap-3 pt-12 pb-8">
      {/* ── Title row with side dashes ── */}
      <Box className="flex items-center justify-center gap-3">
        <Box className="w-5 h-1 bg-[rgb(67,86,32)] rounded-full flex-shrink-0" />
        <Text
          as="span"
          className="font-outfit font-bold text-[28px] md:text-[32px] text-white uppercase tracking-[-0.5px] leading-tight text-center"
        >
          {t("hero.title")}
        </Text>
        <Box className="w-5 h-1 bg-[rgb(67,86,32)] rounded-full flex-shrink-0" />
      </Box>

      {/* ── Subtitle ── */}
      <Text
        as="p"
        className="font-inter text-[16px] text-[#697282] leading-snug text-center max-w-xl"
      >
        {t("hero.subtitle")}
      </Text>
    </Box>
  );
}

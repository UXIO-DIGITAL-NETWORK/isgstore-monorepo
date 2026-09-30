import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

export default function FaqHeader(): React.JSX.Element {
  const { t } = useTranslation("faq");

  return (
    <Box className="flex flex-col items-center gap-3 pt-12 pb-10 text-center">
      {/* Title row with flanking dashes */}
      <Box className="flex flex-wrap items-center justify-center gap-4">
        <Box className="w-7 h-[3px] rounded-full bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] shrink-0 hidden sm:block" />
        <Box
          as="h1"
          className="font-outfit font-bold text-[26px] md:text-[34px] text-white uppercase tracking-tight leading-tight text-center"
        >
          {t("hero.title")}
        </Box>
        <Box className="w-7 h-[3px] rounded-full bg-linear-to-r from-[rgb(208,201,129)] to-[rgb(67,86,32)] shrink-0 hidden sm:block" />
      </Box>

      {/* Subtitle */}
      <Text as="p" className="font-inter text-[15px] text-[#697282] leading-snug">
        {t("hero.subtitle")}
      </Text>
    </Box>
  );
}

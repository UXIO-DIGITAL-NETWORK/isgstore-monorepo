import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";

export default function BeritaHeader(): React.JSX.Element {
  const { t } = useTranslation("berita");

  return (
    <Box className="flex flex-col gap-3">
      {/* Title row with blue left accent bar */}
      <Box className="flex items-center gap-3">
        <Box className="w-1 h-7 rounded-full bg-[rgb(67,86,32)] shrink-0" />
        <Heading
          as="h1"
          level={2}
          className="font-outfit font-bold text-[22px] md:text-[28px] leading-tight tracking-[-0.5px] text-white uppercase"
        >
          {t("title")}
        </Heading>
      </Box>

      {/* Subtitle */}
      <Text as="p" className="font-inter font-normal text-[15px] leading-5 text-[#697282]">
        {t("subtitle")}
      </Text>
    </Box>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import { formatNumber } from "@/lib/format";
import imgDiamond from "@/assets/images/decoration/img_diamond_result.png";

interface ZodiacResultProps {
  diamonds: number;
}

export default function ZodiacResult({
  diamonds,
}: ZodiacResultProps): React.JSX.Element {
  const { t } = useTranslation("zodiac");
  const { locale = "id" } = useParams({ strict: false }) as {
    locale?: string;
  };

  return (
    <Box className="rounded-2xl border border-white/10 bg-[#0B051D]/40 p-6 flex flex-col items-center gap-4 text-center">
      <Text as="p" className="font-inter text-[14px] text-white/60">
        {t("result.title")}
      </Text>
      <Box className="flex items-center gap-3">
        <Image
          src={imgDiamond}
          alt="Diamond"
          priority="eager"
          objectFit="contain"
          className="w-10 h-10"
        />
        <Box className="flex items-baseline gap-2">
          <Text
            as="span"
            className="font-plex font-bold text-[48px] md:text-[56px] leading-none bg-gradient-price bg-clip-text text-transparent"
          >
            {formatNumber(diamonds, locale)}
          </Text>
          <Text
            as="span"
            className="font-outfit font-semibold text-[18px] text-[#9333EA]"
          >
            {t("result.unit")}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

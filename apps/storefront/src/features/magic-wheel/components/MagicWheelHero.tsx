import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import iconMagicWheel from "@/assets/images/decoration/icon_magic_wheel.png";

export default function MagicWheelHero(): React.JSX.Element {
  const { t } = useTranslation("magicWheel");

  return (
    <Box className="flex flex-col items-center gap-4 pt-12 pb-8 text-center">
      <Image
        src={iconMagicWheel}
        alt="Magic Wheel Calculator Icon"
        priority="eager"
        objectFit="contain"
        className="w-24 h-24"
      />
      <Box
        as="h1"
        className="font-outfit font-bold text-[32px] md:text-[42px] text-white uppercase tracking-wide leading-tight text-center"
      >
        {t("hero.title")}
      </Box>
      <Text
        as="p"
        className="font-inter text-[15px] text-[#697282] leading-snug max-w-lg"
      >
        {t("hero.subtitle")}
      </Text>
    </Box>
  );
}

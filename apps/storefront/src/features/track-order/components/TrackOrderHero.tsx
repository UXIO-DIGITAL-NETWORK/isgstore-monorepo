import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

export default function TrackOrderHero(): React.JSX.Element {
  const { t } = useTranslation("trackOrder");

  return (
    <Box className="flex flex-col items-center gap-3 pt-12 pb-4">
      <Text
        as="p"
        className="font-outfit font-bold text-[32px] md:text-[38px] text-white uppercase tracking-wide leading-tight text-center"
      >
        {t("hero.title")}
      </Text>
      <Text
        as="p"
        className="font-inter text-[14px] text-white/55 leading-snug text-center max-w-lg"
      >
        {t("hero.subtitle")}
      </Text>
    </Box>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

export default function MembershipUpgradeBanner(): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  return (
    <Box className="flex items-center gap-3 mb-5">
      {/* Accent bar */}
      <Box className="w-1 h-8 rounded-full bg-linear-to-b from-[rgb(67,86,32)] to-[rgb(208,201,129)] shrink-0" />

      <Box className="flex flex-col gap-0.5">
        <Box
          as="h2"
          className="font-outfit font-bold text-[18px] md:text-[22px] text-white uppercase tracking-tight leading-tight"
        >
          {t("banner.title")}
        </Box>
        <Text
          as="p"
          className="font-inter text-[13px] text-white/50 leading-snug"
        >
          {t("banner.subtitle")}
        </Text>
      </Box>
    </Box>
  );
}

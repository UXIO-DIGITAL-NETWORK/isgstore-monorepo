import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

export default function PrivacyPolicyHeader(): React.JSX.Element {
  const { t } = useTranslation("privacyPolicy");

  return (
    <Box className="pt-12 pb-8">
      {/* Title */}
      <Box
        as="h1"
        className="font-outfit font-bold text-[32px] md:text-[40px] text-white leading-tight mb-2"
      >
        {t("title")}
      </Box>

      {/* Gradient underline accent */}
      <Box className="w-16 h-[3px] rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] mt-3 mb-2" />

      {/* Last updated */}
      <Text as="p" className="font-inter text-[13px] text-white/40 mt-3 leading-none">
        {t("lastUpdated")}
      </Text>
    </Box>
  );
}

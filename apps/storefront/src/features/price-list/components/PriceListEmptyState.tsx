import React from "react";
import { useTranslation } from "react-i18next";
import { Gamepad2 } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";

export default function PriceListEmptyState(): React.JSX.Element {
  const { t } = useTranslation("priceList");

  return (
    <Box className="flex flex-col items-center justify-center py-24 gap-5">
      {/* Icon glow ring */}
      <Box className="relative flex items-center justify-center w-20 h-20">
        <Box className="absolute inset-0 rounded-full bg-[rgb(208,201,129)]/15 blur-xl" />
        <Box className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10">
          <Gamepad2 className="w-9 h-9 text-[rgb(208,201,129)]" />
        </Box>
      </Box>

      {/* Copy */}
      <Box className="flex flex-col items-center gap-2 text-center">
        <Heading
          as="h3"
          className="font-outfit font-bold text-[18px] text-white leading-tight"
        >
          {t("noGameSelected.title")}
        </Heading>
        <Text as="p" className="font-inter text-[14px] text-[#909AAE] max-w-xs leading-relaxed">
          {t("noGameSelected.subtitle")}
        </Text>
      </Box>
    </Box>
  );
}

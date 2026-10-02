import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

interface DuaFaktorCardProps {
  onSetup2fa: () => void;
}

export default function DuaFaktorCard({ onSetup2fa }: DuaFaktorCardProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  return (
    <Box className="p-px rounded-2xl bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)]">
      <Box className="rounded-[15px] bg-[rgb(14,20,10)] px-5 py-5">
        <Box className="flex items-center justify-between gap-4">
          {/* Text block */}
          <Box className="flex flex-col gap-1.5 min-w-0">
            <Text
              as="span"
              className="font-outfit font-bold text-[14px] text-white leading-snug"
            >
              {t("pengaturanAkun.twoFactor.title")}
            </Text>
            <Text as="span" className="font-inter text-[12px] text-white/55 leading-relaxed">
              {t("pengaturanAkun.twoFactor.description")}
            </Text>
          </Box>

          {/* CTA button */}
          <Box
            as="button"
            type="button"
            onClick={onSetup2fa}
            className="shrink-0 px-5 py-2 rounded-full bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] shadow-cta-primary font-outfit font-bold text-white text-[12px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            {t("pengaturanAkun.twoFactor.button")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

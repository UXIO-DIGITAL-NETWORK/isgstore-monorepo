import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { MemberCredits } from "@/features/checkout/types/checkout.type";

interface Props {
  credits: MemberCredits;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function MemberCreditsCard({ credits, isSelected, onSelect }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("checkout");

  return (
    <Box
      className={cn(
        "rounded-xl border overflow-hidden transition-colors",
        isSelected ? "border-[rgb(208,201,129)]" : "border-white/8",
      )}
    >
      {/* "Khusus Member" gold banner */}
      <Box className="w-full px-3 py-2 bg-[rgb(39,53,15)]">
        <Text as="span" className="font-outfit font-semibold text-[12px] text-white leading-none">
          {t("payment.memberOnly")}
        </Text>
      </Box>

      {/* Credits selectable row */}
      <Box
        as="button"
        type="button"
        onClick={() => onSelect(credits.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-3 cursor-pointer outline-none transition-colors",
          isSelected ? "bg-[rgba(208,201,129,0.07)]" : "bg-white/[0.02] hover:bg-white/[0.04]",
        )}
      >
        {/* Coin icon */}
        <Box className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
          <img
            src={credits.logo}
            alt="Credits"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </Box>

        {/* Label + balance */}
        <Box className="flex flex-col items-start gap-0.5">
          <Text
            as="span"
            className={cn(
              "font-outfit font-semibold text-[13px] leading-none",
              isSelected ? "text-white" : "text-white/80",
            )}
          >
            {t("payment.credits")}
          </Text>
          <Text
            as="span"
            className="font-plex text-[12px] text-white/50 leading-none"
          >
            {formatCurrency(credits.balance, i18n.language)}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

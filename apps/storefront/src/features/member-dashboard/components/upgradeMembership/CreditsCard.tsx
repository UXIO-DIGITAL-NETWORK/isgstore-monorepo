import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import iconCredit from "@/assets/images/checkout/icon_credit.png";

interface Props {
  balance: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

/** "Saldo Saya / Credits" selectable payment option — placed above the collapsible groups. */
export default function CreditsCard({ balance, isSelected, onSelect }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

  return (
    <Box className="flex flex-col rounded-xl overflow-hidden border border-white/8 mb-2">
      {/* Gold banner header */}
      <Box className="px-3 py-2 bg-[rgb(39,53,15)]">
        <Text
          as="span"
          className="font-outfit font-semibold text-[12px] text-white/90 leading-none"
        >
          {t("upgradeMembership.payment.saldoTitle")}
        </Text>
      </Box>

      {/* Selectable credits row */}
      <Box
        as="button"
        type="button"
        onClick={() => onSelect("credits")}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-3 bg-[rgb(14,20,10)] border-t-2 transition-all cursor-pointer outline-none",
          isSelected ? "border-[rgb(208,201,129)]" : "border-transparent hover:border-white/10",
        )}
      >
        {/* Coin icon */}
        <Box className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
          <Box
            as="img"
            src={iconCredit}
            alt="credits"
            className="w-8 h-8 object-contain"
          />
        </Box>

        {/* Label + balance */}
        <Box className="flex flex-col items-start gap-0.5">
          <Text as="span" className="font-outfit font-semibold text-[13px] text-white leading-none">
            {t("upgradeMembership.payment.creditsLabel")}
          </Text>
          <Text as="span" className="font-plex text-[12px] text-white/50 leading-none">
            {formatCurrency(balance, locale)}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

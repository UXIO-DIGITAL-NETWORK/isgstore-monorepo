import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import type { DiamondPackage } from "@/features/checkout/types/checkout.type";

interface Props {
  selectedPackage: DiamondPackage | null;
  totalPrice: number;
  gameLogo: string;
  gameName: string;
  onSubmit: () => void;
}

export default function OrderSummary({
  selectedPackage,
  totalPrice,
  gameLogo,
  gameName,
  onSubmit,
}: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("checkout");
  const locale = i18n.language;

  return (
    <Box className="rounded-[16px] border border-[rgba(147,51,234,0.35)] bg-[rgba(147,51,234,0.04)] overflow-hidden">
      {/* Selected package display */}
      <Box className="px-4 py-3 flex items-center gap-3 border-b border-[rgba(147,51,234,0.2)]">
        {/* Game logo thumb */}
        <Box className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <img src={gameLogo} alt={gameName} className="w-full h-full object-cover" />
        </Box>

        {/* Package info */}
        <Box className="flex-1 min-w-0">
          <Text as="span" className="font-inter text-[11px] text-white/40 leading-none block mb-1">
            {t("summary.selectedPackage")}
          </Text>
          {selectedPackage ? (
            <Text as="span" className="font-dmsans font-bold text-[14px] text-white leading-tight block truncate">
              {selectedPackage.name}
            </Text>
          ) : (
            <Text as="span" className="font-inter text-[13px] text-white/30 italic leading-tight block">
              {t("summary.noPackageSelected")}
            </Text>
          )}
        </Box>

        {/* Price */}
        {selectedPackage && (
          <Box className="shrink-0">
            <PriceText className="text-[14px]">
              {formatCurrency(selectedPackage.price, locale)}
            </PriceText>
          </Box>
        )}
      </Box>

      {/* Total + CTA */}
      <Box className="px-4 py-3 flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Text as="span" className="font-outfit font-medium text-[13px] text-white/70 leading-none">
            {t("summary.total")}
          </Text>
          <PriceText className="text-[18px] leading-none">
            {formatCurrency(totalPrice, locale)}
          </PriceText>
        </Box>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={!selectedPackage}
          className="w-full py-3 text-[15px]"
        >
          {t("summary.buyNow")}
        </Button>
      </Box>
    </Box>
  );
}

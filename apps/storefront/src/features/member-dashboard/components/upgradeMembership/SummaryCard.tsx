import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

interface Props {
  planName: string | undefined;
  isSubmitting?: boolean;
  /** Server-side failure (e.g. insufficient balance), shown above the button. */
  errorMessage?: string | null;
  adminFee: number;
  total: number;
  selectedPaymentName: string | undefined;
  onSubmit: () => void;
}

export default function SummaryCard({
  planName,
  isSubmitting,
  errorMessage,
  adminFee,
  total,
  selectedPaymentName,
  onSubmit,
}: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

  const isDisabled = !planName || !selectedPaymentName || Boolean(isSubmitting);

  return (
    <Box className="rounded-2xl border border-dotted border-[rgba(208,201,129,0.5)] bg-[rgb(14,20,10)] overflow-hidden">
      {/* Info rows */}
      <Box className="px-5 py-4 flex items-start justify-between gap-4">
        {/* Left: labels */}
        <Box className="flex flex-col gap-1.5">
          {planName && (
            <Text as="span" className="text-[13px] font-outfit font-semibold text-white leading-none">
              {t("upgradeMembership.summary.planLabel", { plan: planName })}
            </Text>
          )}

          {adminFee > 0 && (
            <Text as="span" className="text-[12px] font-inter text-white/60 leading-none">
              {t("upgradeMembership.summary.adminFeeLabel")}{" "}
              <Text as="span" className="text-[12px] font-plex text-white/60">
                +{formatCurrency(adminFee, locale)}
              </Text>
            </Text>
          )}

          {selectedPaymentName && (
            <Text as="span" className="text-[12px] font-inter text-white/45 leading-none">
              {selectedPaymentName} {t("upgradeMembership.summary.paymentSuffix")}
            </Text>
          )}
        </Box>

        {/* Right: total */}
        <Box className="flex flex-col items-end gap-1 shrink-0">
          <Text as="span" className="text-[11px] font-inter text-white/45 leading-none whitespace-nowrap">
            {t("upgradeMembership.summary.totalLabel")}
          </Text>
          <PriceText className="text-[20px] leading-tight">
            {formatCurrency(total, locale)}
          </PriceText>
        </Box>
      </Box>

      {/* Divider */}
      <Box className="h-px bg-white/8" />

      {/* CTA */}
      <Box className="px-5 py-4 flex flex-col gap-2">
        {errorMessage && (
          <Text as="span" className="font-inter text-[12px] text-[#EF4444] leading-relaxed">
            {errorMessage}
          </Text>
        )}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled}
          className="w-full py-3 text-[15px] flex items-center justify-center gap-2"
        >
          {t("upgradeMembership.summary.submitButton")}
        </Button>
      </Box>
    </Box>
  );
}

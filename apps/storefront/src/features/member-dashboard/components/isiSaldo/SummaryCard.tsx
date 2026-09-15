import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

interface Props {
  isSubmitting?: boolean;
  /** Server-side failure (channel minimum, closed storefront), shown above the button. */
  errorMessage?: string | null;
  /** What the customer pays — and, for a top-up, exactly what lands in the wallet. */
  total: number;
  selectedPaymentName: string | undefined;
  onSubmit: () => void;
}

export default function SummaryCard({
  total,
  selectedPaymentName,
  onSubmit,
  isSubmitting,
  errorMessage,
}: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

  return (
    <Box className="rounded-2xl border border-dotted border-[rgba(147,51,234,0.5)] bg-[#0D1117] overflow-hidden">
      {/* Info rows */}
      <Box className="px-5 py-4 flex items-start justify-between gap-4">
        {/* Left: labels */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="text-[13px] font-outfit font-semibold text-white leading-none">
            {t("isiSaldo.summary.title")}
          </Text>

          {selectedPaymentName && (
            <Text as="span" className="text-[12px] font-inter text-white/45 leading-none">
              {selectedPaymentName}
            </Text>
          )}
        </Box>

        {/* Right: total */}
        <Box className="flex flex-col items-end gap-1 shrink-0">
          <Text as="span" className="text-[11px] font-inter text-white/45 leading-none whitespace-nowrap">
            {t("isiSaldo.summary.totalLabel")}
          </Text>
          <PriceText className="text-[20px] leading-tight">
            {formatCurrency(total, locale)}
          </PriceText>
        </Box>
      </Box>

      {/* Divider */}
      <Box className="h-px bg-white/8" />

      {/* CTA */}
      <Box className="px-5 py-4">
        {errorMessage && (
          <Text as="span" className="font-inter text-[12px] text-[#EF4444] leading-relaxed mb-2 block">
            {errorMessage}
          </Text>
        )}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={total <= 0 || !selectedPaymentName || Boolean(isSubmitting)}
          className="w-full py-3 text-[15px] flex items-center justify-center gap-2"
        >
          {t("isiSaldo.summary.submitButton")}
        </Button>
      </Box>
    </Box>
  );
}

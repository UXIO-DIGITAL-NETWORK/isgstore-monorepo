import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Ticket } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/lib/format";
import SectionCard from "@/features/checkout/components/SectionCard";
import VoucherModal from "@/features/checkout/components/promo/VoucherModal";

interface PromoCodeProps {
  /** The selected package, so percentage codes and minimum-purchase rules are
   * evaluated against the real order value rather than zero. */
  productId?: number;
  amount?: number;
  applied?: { code: string; discountAmount: number } | null;
  onApplied?: (promo: { code: string; discountAmount: number }) => void;
  onCleared?: () => void;
}

export default function PromoCode({
  productId,
  amount,
  applied,
  onApplied,
  onCleared,
}: PromoCodeProps): React.JSX.Element {
  const { t } = useTranslation("checkout");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <SectionCard stepNumber={6} title={t("promo.title")} gradientBorder>
      <Box
        as="button"
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3.5 text-left cursor-pointer hover:border-[#3B82F6]/40 transition-colors"
      >
        <Box className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
          <Ticket className="w-5 h-5 text-[#3B82F6]" />
        </Box>
        <Box className="flex-1 flex flex-col gap-0.5 min-w-0">
          <Text as="span" className="font-outfit font-bold text-[14px] text-white leading-tight">
            {applied ? applied.code : t("promo.trigger.title")}
          </Text>
          <Text as="span" className="font-inter text-[12px] text-white/45 leading-snug truncate">
            {applied
              ? t("promo.trigger.applied", { amount: formatCurrency(applied.discountAmount) })
              : t("promo.trigger.subtitle")}
          </Text>
        </Box>
        <Box className="flex items-center gap-1.5 rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-3.5 py-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#93C5FD]" />
          <Text as="span" className="font-outfit font-semibold text-[12px] text-[#93C5FD] leading-none">
            {applied ? t("promo.trigger.change") : t("promo.trigger.cta")}
          </Text>
        </Box>
      </Box>

      {applied && (
        <Box
          as="button"
          type="button"
          onClick={onCleared}
          className="self-start font-inter text-[12px] text-white/45 hover:text-white underline cursor-pointer"
        >
          {t("promo.trigger.remove")}
        </Box>
      )}

      <VoucherModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={productId}
        amount={amount}
        onApplied={onApplied}
      />
    </SectionCard>
  );
}

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import type { DiamondPackage } from "@/features/checkout/types/checkout.type";
import OrderConfirmModal from "./OrderConfirmModal";

interface Props {
  selectedPackage: DiamondPackage | null;
  totalPrice: number;
  gameThumbnail: string;
  gameName: string;
  selectedPaymentName?: string;
  userId: string;
  serverId: string;
  whatsapp: string;
  onSubmit: () => void;
}

export default function OrderSummary({
  selectedPackage,
  totalPrice,
  gameThumbnail,
  gameName,
  selectedPaymentName,
  userId,
  serverId,
  whatsapp,
  onSubmit,
}: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("checkout");
  const locale = i18n.language;
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Box className="rounded-2xl border border-dotted border-[rgba(147,51,234,0.5)] bg-[#0D1117] overflow-hidden">
      {/* Package info row */}
      <Box className="px-4 py-4 flex items-center gap-3">
        {/* Portrait game thumbnail */}
        <Box className="w-[60px] h-[75px] rounded-xl overflow-hidden shrink-0 border border-violet-75/30 shadow-glow-violet">
          <img src={gameThumbnail} alt={gameName} className="w-full h-full object-cover" />
        </Box>

        {/* Package details */}
        <Box className="flex-1 min-w-0 flex flex-col gap-1">
          {selectedPackage ? (
            <Text as="span" className="font-dmsans font-bold text-[14px] text-white leading-tight block">
              {selectedPackage.name}
            </Text>
          ) : (
            <Text as="span" className="font-inter text-[13px] text-white/30 italic leading-tight block">
              {t("summary.noPackageSelected")}
            </Text>
          )}
          {selectedPaymentName && (
            <Text as="span" className="font-inter text-[13px] text-white/60 leading-none block">
              1x - {selectedPaymentName}
            </Text>
          )}
          <Text as="span" className="font-inter text-[11px] text-white/35 italic leading-none block">
            **{t("summary.instantProcess")}
          </Text>
        </Box>

        {/* Total Bayar + price */}
        <Box className="shrink-0 flex flex-col items-end gap-1">
          <Text as="span" className="font-inter text-[11px] text-white/45 leading-none whitespace-nowrap">
            {t("summary.totalLabel")}
          </Text>
          <PriceText className="text-[20px] leading-tight">
            {formatCurrency(totalPrice, locale)}
          </PriceText>
        </Box>
      </Box>

      {/* Divider */}
      <Box className="h-px bg-white/8 mx-0" />

      {/* CTA button */}
      <Box className="px-4 py-4">
        <Button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!selectedPackage || whatsapp.trim() === ""}
          className="w-full py-3 text-[15px]"
        >
          {t("summary.buyNow")}
        </Button>
      </Box>

      {/* Confirmation modal */}
      <OrderConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onSubmit();
          setConfirmOpen(false);
        }}
        userId={userId}
        serverId={serverId}
        username="Ramonezz"
        itemLabel={
          selectedPackage
            ? `${selectedPackage.amount} ${t("packages.unit")}`
            : ""
        }
        productName={gameName}
        price={selectedPackage?.price ?? 0}
        paymentName={selectedPaymentName}
        total={totalPrice}
      />
    </Box>
  );
}

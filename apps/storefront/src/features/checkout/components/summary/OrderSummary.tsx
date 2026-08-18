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
  /** Package price ("Harga"). */
  totalPrice: number;
  /** "Biaya Admin" — the selected payment method's fee. */
  adminFee: number;
  gameThumbnail: string;
  gameName: string;
  selectedPaymentName?: string;
  userId: string;
  serverId: string;
  whatsapp: string;
  /** Validated in-game nickname, or null when the game has no lookup provider. */
  nickname?: string | null;
  isSubmitting?: boolean;
  /**
   * Last gate before the confirmation modal: validates the account fields and,
   * for a game with a lookup provider, makes sure the id has actually been
   * checked. Resolving false keeps the modal shut — the page has already told
   * the buyer why.
   */
  onRequestConfirm?: () => Promise<boolean>;
  /** True while that gate is running (a supplier lookup takes a moment). */
  isPreparing?: boolean;
  onSubmit: () => void;
}

/** One label/value row in the price breakdown. */
function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-center justify-between gap-4">
      <Text as="span" className="font-inter text-[13px] text-white/55 leading-none">
        {label}
      </Text>
      <Text as="span" className="font-plex text-[13px] text-white font-medium leading-none">
        {value}
      </Text>
    </Box>
  );
}

export default function OrderSummary({
  selectedPackage,
  totalPrice,
  adminFee,
  gameThumbnail,
  gameName,
  selectedPaymentName,
  userId,
  serverId,
  whatsapp,
  nickname,
  isSubmitting = false,
  onRequestConfirm,
  isPreparing = false,
  onSubmit,
}: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("checkout");
  const locale = i18n.language;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const total = totalPrice + adminFee;

  const handleTopUp = async () => {
    if (!onRequestConfirm) {
      setConfirmOpen(true);
      return;
    }

    if (await onRequestConfirm()) setConfirmOpen(true);
  };

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
      </Box>

      {/* Divider */}
      <Box className="h-px bg-white/8 mx-0" />

      {/* Price breakdown */}
      <Box className="px-4 pt-4 pb-2 flex flex-col gap-2.5">
        <FeeRow label={t("summary.price")} value={formatCurrency(totalPrice, locale)} />
        {adminFee > 0 && <FeeRow label={t("summary.adminFee")} value={formatCurrency(adminFee, locale)} />}
      </Box>

      {/* Divider */}
      <Box className="h-px bg-white/8 mx-0" />

      {/* Total */}
      <Box className="px-4 py-3 flex items-center justify-between">
        <Text as="span" className="font-outfit font-bold text-[14px] text-white">
          {t("summary.totalPayment")}
        </Text>
        <PriceText className="text-[20px] leading-tight">{formatCurrency(total, locale)}</PriceText>
      </Box>

      {/* CTA button */}
      <Box className="px-4 pb-4">
        <Button
          type="button"
          onClick={() => void handleTopUp()}
          // `isPreparing` is in here too: a second click would fire a second
          // supplier lookup, and for some games that one is billed.
          disabled={
            !selectedPackage ||
            !selectedPaymentName ||
            whatsapp.trim() === "" ||
            isPreparing ||
            isSubmitting
          }
          className="w-full py-3 text-[15px]"
        >
          {isPreparing
            ? t("summary.checkingId")
            : isSubmitting
              ? t("summary.processing")
              : t("summary.buyNow")}
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
        username={nickname ?? undefined}
        itemLabel={
          selectedPackage
            ? selectedPackage.amount > 0
              ? `${selectedPackage.amount} ${t("packages.unit")}`
              : selectedPackage.name
            : ""
        }
        productName={gameName}
        price={selectedPackage?.price ?? 0}
        paymentName={selectedPaymentName}
        adminFee={adminFee}
        total={total}
      />
    </Box>
  );
}

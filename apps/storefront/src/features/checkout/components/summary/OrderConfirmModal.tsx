import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userId: string;
  serverId: string;
  /** Undefined when the game has no nickname lookup — the row shows "-". */
  username?: string;
  itemLabel: string;
  productName: string;
  price: number;
  paymentName?: string;
  /** "Biaya Admin" — the payment method's fee; hidden when 0. */
  adminFee?: number;
  total: number;
}

// ── Local helper: one label/value row ────────────────────────────────────────
function Field({
  label,
  value,
  numeric = false,
  bold = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
  bold?: boolean;
}) {
  return (
    <Box className="flex items-center justify-between gap-4">
      <Text
        as="span"
        className="font-inter text-[13px] text-white/55 leading-none"
      >
        {label}
      </Text>
      <Text
        as="span"
        className={[
          "text-[13px] leading-none text-right",
          numeric ? "font-plex" : "font-inter",
          bold ? "font-bold text-white" : "font-medium text-white",
        ].join(" ")}
      >
        {value}
      </Text>
    </Box>
  );
}

// ── Local helper: card container with dash-line + title header ────────────────
function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box className="rounded-2xl border border-[rgba(147,51,234,0.5)] bg-[rgba(88,28,135,0.35)] overflow-hidden">
      {/* Card header */}
      <Box className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Box className="w-6 h-px bg-white/40 shrink-0" />
        <Text
          as="span"
          className="font-outfit font-bold text-[13px] text-white leading-none"
        >
          {title}
        </Text>
      </Box>

      {/* Card body */}
      <Box className="px-4 pb-4 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function OrderConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userId,
  serverId,
  username,
  itemLabel,
  productName,
  price,
  paymentName,
  adminFee = 0,
  total,
}: Props): React.ReactPortal | null {
  const { t, i18n } = useTranslation("checkout");
  const locale = i18n.language;

  // ESC to close + body scroll-lock
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    // Backdrop
    <Box
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Gradient border wrapper — stop click propagation so backdrop click doesn't fire */}
      <Box
        className="w-full max-w-md p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9333EA] shadow-glow-violet"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Box
          role="dialog"
          aria-modal="true"
          aria-label={t("confirmModal.title")}
          className="rounded-[15px] bg-[rgba(42,4,98,0.82)] p-6 flex flex-col gap-5"
        >
        {/* Header */}
        <Box className="flex flex-col gap-2">
          <Text
            as="span"
            className="font-outfit font-bold text-[20px] text-white leading-tight uppercase"
          >
            {t("confirmModal.title")}
          </Text>
          <Text
            as="span"
            className="font-inter text-[13px] text-white/55 leading-snug"
          >
            {t("confirmModal.subtitle")}
          </Text>
        </Box>

        {/* Data Player card */}
        <InfoCard title={t("confirmModal.dataPlayer")}>
          <Field label={t("confirmModal.userId")} value={userId || "-"} numeric />
          <Field label={t("confirmModal.serverId")} value={serverId || "-"} numeric />
          <Field label={t("confirmModal.username")} value={username || "-"} />
        </InfoCard>

        {/* Ringkasan Pesanan card */}
        <InfoCard title={t("confirmModal.orderSummary")}>
          <Field label={t("confirmModal.item")} value={itemLabel || "-"} />
          <Field label={t("confirmModal.product")} value={productName} />
          <Field
            label={t("confirmModal.price")}
            value={formatCurrency(price, locale)}
            numeric
          />
          <Field
            label={t("confirmModal.method")}
            value={paymentName ?? "-"}
          />
          {adminFee > 0 && (
            <Field
              label={t("confirmModal.adminFee")}
              value={formatCurrency(adminFee, locale)}
              numeric
            />
          )}

          {/* Divider before total */}
          <Box className="h-px bg-white/10" />

          <Field
            label={t("confirmModal.totalPay")}
            value={formatCurrency(total, locale)}
            numeric
            bold
          />
        </InfoCard>

        {/* Action buttons */}
        <Box className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full py-3 text-[15px]"
            onClick={onConfirm}
          >
            {t("confirmModal.confirm")}
          </Button>

          <button
            type="button"
            className="w-full rounded-[50px] border border-white/15 bg-white/5 py-3 font-outfit font-semibold text-[15px] text-white/80 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            {t("confirmModal.cancel")}
          </button>
        </Box>
        </Box>
      </Box>
    </Box>,
    document.body,
  );
}

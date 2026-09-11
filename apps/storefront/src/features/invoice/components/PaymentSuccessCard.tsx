import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Info } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import iconPaymentSvg from "@/assets/icons/icon_payment.svg";

interface Props {
  invoiceNumber: string;
  paymentName: string;
}

export default function PaymentSuccessCard({ invoiceNumber, paymentName }: Props): React.JSX.Element {
  const { t } = useTranslation("invoice");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invoiceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silent fail
    }
  };

  // Determine label: e.g. "QRIS" → "QRIS All Payment"; fallback to paymentName
  const isQris = paymentName.toLowerCase().includes("qris");
  const methodLabel = isQris ? t("paymentMethod.qrisLabel") : paymentName;

  return (
    /* Gradient-border wrapper */
    <Box className="p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9333EA]">
      <Box className="rounded-[15px] bg-[#0D1117] overflow-hidden">

        {/* Header */}
        <Box className="flex items-center gap-3 px-4 py-4">
          <img src={iconPaymentSvg} alt="Payment" className="w-8 h-8 shrink-0" />
          <Text
            as="span"
            className="font-outfit font-bold text-[13px] uppercase tracking-[0.6px] text-white leading-none"
          >
            {t("paymentMethod.title")}
          </Text>
        </Box>

        {/* Divider */}
        <Box className="h-px bg-white/8" />

        {/* Body */}
        <Box className="px-4 py-4 flex flex-col gap-4">
          {/* Method name sub-label */}
          <Text as="p" className="font-outfit font-bold text-[14px] text-white leading-none">
            {methodLabel}
          </Text>

          {/* Invoice number row */}
          <Box className="flex items-center justify-between gap-3">
            <Text as="span" className="font-inter text-[13px] text-white/55 shrink-0 w-[130px]">
              {t("paymentMethod.invoiceNumber")}
            </Text>
            <Box className="flex items-center gap-2 flex-1 min-w-0">
              <Box className="flex-1 min-w-0 rounded-lg border border-white/10 bg-[#0A0D14] px-3 py-2 overflow-hidden">
                <Text as="span" className="font-plex text-[12px] text-white leading-none block truncate">
                  {invoiceNumber}
                </Text>
              </Box>
              <Box
                as="button"
                type="button"
                onClick={handleCopy}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
                aria-label={t("a11y.copyInvoiceNumber")}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/60" />
                )}
              </Box>
            </Box>
          </Box>

          {/* Payment status row — PAID (green) */}
          <Box className="flex items-center gap-3">
            <Text as="span" className="font-inter text-[13px] text-white/55 w-[130px] shrink-0">
              {t("paymentMethod.paymentStatus")}
            </Text>
            <Box className="rounded-md border border-emerald-400/70 px-3 py-0.5">
              <Text as="span" className="font-plex font-bold text-[11px] text-emerald-400 leading-none">
                {t("success.paid")}
              </Text>
            </Box>
          </Box>

          {/* Transaction status row — SUCCESS (green) */}
          <Box className="flex items-center gap-3">
            <Text as="span" className="font-inter text-[13px] text-white/55 w-[130px] shrink-0">
              {t("paymentMethod.transactionStatus")}
            </Text>
            <Box className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5">
              <Text as="span" className="font-plex font-bold text-[11px] text-emerald-400 leading-none">
                {t("success.success")}
              </Text>
            </Box>
          </Box>

          {/* Item delivered note */}
          <Box className="flex items-start gap-3 rounded-xl border border-[rgba(147,51,234,0.4)] bg-[rgba(88,28,135,0.15)] px-3 py-3">
            <Info className="w-4 h-4 text-violet-75 shrink-0 mt-0.5" />
            <Text as="span" className="font-inter text-[12px] text-white/65 leading-relaxed">
              {t("success.itemDeliveredNote")}{" "}
              <Box
                as="a"
                href="#"
                className="text-violet-75 underline underline-offset-2 hover:text-white transition-colors"
              >
                {t("success.customerSupport")}
              </Box>
              .
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

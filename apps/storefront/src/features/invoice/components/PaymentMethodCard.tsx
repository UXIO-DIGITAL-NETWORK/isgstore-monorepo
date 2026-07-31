import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Download, Info } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import iconPaymentSvg from "@/assets/icons/icon_payment.svg";
import { useQrDataUrl } from "@/features/invoice/hooks/useQrDataUrl";
import { PAYMENT_STATUS_LABELS, TRANSACTION_STATUS_STYLES } from "@/features/invoice/lib/statusDisplay";
import type { PaymentInstructions, TransactionStatus } from "@/types/models/transaction.model";

interface Props {
  invoiceNumber: string;
  paymentName: string;
  /** Persisted at checkout, so this survives a refresh. */
  instructions: PaymentInstructions | null;
  status: TransactionStatus;
  paidAt: string | null;
}

export default function PaymentMethodCard({
  invoiceNumber,
  paymentName,
  instructions,
  status,
  paidAt,
}: Props): React.JSX.Element {
  const { t } = useTranslation("invoice");
  const [copied, setCopied] = useState<"invoice" | "account" | null>(null);

  // The gateway sends an EMV payload, not an image — render it here so the code
  // on screen always belongs to this invoice.
  const qrDataUrl = useQrDataUrl(instructions?.qr_string);
  const virtualAccount = instructions?.virtual_account ?? null;
  const checkoutUrl = instructions?.checkout_url ?? null;

  const copy = async (value: string, field: "invoice" | "account") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard unavailable — silent fail
    }
  };

  const handleCopy = () => copy(invoiceNumber, "invoice");

  // Determine label: e.g. "QRIS" → "QRIS All Payment"; fallback to paymentName
  const isQris = paymentName.toLowerCase().includes("qris");
  const methodLabel = isQris ? t("paymentMethod.qrisLabel") : paymentName;

  const paymentStatus = paidAt ? t("success.paid") : t("paymentMethod.unpaid");
  const transactionStyle = TRANSACTION_STATUS_STYLES[status];
  const transactionLabel = t(PAYMENT_STATUS_LABELS[status]);

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
                aria-label="Copy invoice number"
              >
                {copied === "invoice" ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/60" />
                )}
              </Box>
            </Box>
          </Box>

          {/* Payment status row */}
          <Box className="flex items-center gap-3">
            <Text as="span" className="font-inter text-[13px] text-white/55 w-[130px] shrink-0">
              {t("paymentMethod.paymentStatus")}
            </Text>
            <Box
              className={
                paidAt
                  ? "rounded-md border border-green-400/70 px-3 py-0.5"
                  : "rounded-md border border-amber-400/70 px-3 py-0.5"
              }
            >
              <Text
                as="span"
                className={[
                  "font-plex font-bold text-[11px] leading-none",
                  paidAt ? "text-green-400" : "text-amber-400",
                ].join(" ")}
              >
                {paymentStatus}
              </Text>
            </Box>
          </Box>

          {/* Transaction status row */}
          <Box className="flex items-center gap-3">
            <Text as="span" className="font-inter text-[13px] text-white/55 w-[130px] shrink-0">
              {t("paymentMethod.transactionStatus")}
            </Text>
            <Box className={transactionStyle.wrapper}>
              <Text as="span" className={transactionStyle.text}>
                {transactionLabel}
              </Text>
            </Box>
          </Box>

          {/* Message row */}
          <Box className="flex items-start gap-3">
            <Text as="span" className="font-inter text-[13px] text-white/55 w-[130px] shrink-0 mt-0.5">
              {t("paymentMethod.message")}
            </Text>
            <Text as="span" className="font-inter text-[13px] text-white/70 leading-snug flex-1">
              {t("paymentMethod.scanMessage")}
            </Text>
          </Box>

          {/* QR Code — rendered from the gateway's payload for this invoice */}
          {qrDataUrl && (
            <>
              <Box className="flex justify-center">
                <Box className="bg-white rounded-xl p-3 shadow-glow-violet">
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-[190px] h-[190px] object-contain"
                  />
                </Box>
              </Box>

              {/* Download QR Code */}
              <Box className="flex justify-center">
                <Box
                  as="a"
                  href={qrDataUrl}
                  download={`qris-${invoiceNumber}.png`}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <Download className="w-4 h-4 text-white/55 group-hover:text-white transition-colors" />
                  <Text as="span" className="font-inter text-[13px] text-white/55 group-hover:text-white transition-colors underline underline-offset-2">
                    {t("paymentMethod.downloadQr")}
                  </Text>
                </Box>
              </Box>
            </>
          )}

          {/* Virtual account — the VA equivalent of the QR block: the number is
              what the customer transfers to, so it gets the same prominence. */}
          {virtualAccount && (
            <Box className="flex flex-col gap-2">
              <Text as="span" className="font-inter text-[13px] text-white/55">
                {instructions?.bank_code ?? paymentName}
              </Text>
              <Box className="flex items-center gap-2">
                <Box className="flex-1 min-w-0 rounded-lg border border-[rgba(147,51,234,0.4)] bg-[#0A0D14] px-3 py-3 overflow-hidden">
                  <Text as="span" className="font-plex font-bold text-[18px] text-white leading-none block truncate tracking-wide">
                    {virtualAccount}
                  </Text>
                </Box>
                <Box
                  as="button"
                  type="button"
                  onClick={() => copy(virtualAccount, "account")}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
                  aria-label="Copy virtual account number"
                >
                  {copied === "account" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/60" />
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* Hosted checkout — the only actionable element for a payment link. */}
          {checkoutUrl && (
            <Box className="flex justify-center">
              <Box
                as="a"
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center rounded-[50px] bg-linear-to-r from-[#3B82F6] to-[#9234EA] py-3 font-outfit font-bold text-[14px] text-[#E9D5FF] cursor-pointer"
              >
                {t("failed.choosePaymentMethod")}
              </Box>
            </Box>
          )}

          {/* Verification note */}
          <Box className="flex items-start gap-3 rounded-xl border border-[rgba(147,51,234,0.4)] bg-[rgba(88,28,135,0.15)] px-3 py-3">
            <Info className="w-4 h-4 text-violet-75 shrink-0 mt-0.5" />
            <Text as="span" className="font-inter text-[12px] text-white/65 leading-relaxed">
              {t("paymentMethod.verifyNote")}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

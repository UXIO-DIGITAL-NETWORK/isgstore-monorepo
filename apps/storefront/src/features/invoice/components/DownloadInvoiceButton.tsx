import React from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { downloadInvoice } from "@/features/invoice/lib/downloadInvoice";

interface Props {
  invoiceNumber: string;
  className?: string;
}

/** Secondary outlined button that downloads the invoice PDF (matches the email UI). */
export default function DownloadInvoiceButton({ invoiceNumber, className }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("invoice");

  return (
    <Box
      as="button"
      type="button"
      onClick={() => downloadInvoice(invoiceNumber, i18n.language)}
      className={
        "flex items-center gap-2 rounded-[50px] border border-white/15 bg-white/5 font-outfit font-semibold text-[13px] text-white/80 py-2.5 px-6 cursor-pointer hover:bg-white/10 transition-colors " +
        (className ?? "")
      }
    >
      <Download className="w-4 h-4 text-white/60" />
      <Text
        as="span"
        className="font-outfit text-[13px] text-white/80"
      >
        {t("success.downloadInvoice")}
      </Text>
    </Box>
  );
}

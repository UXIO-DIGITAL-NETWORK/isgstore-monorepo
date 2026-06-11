import React from "react";
import { useParams } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useTranslation } from "react-i18next";
import PaymentSuccessHero from "@/features/invoice/components/PaymentSuccessHero";
import OrderDetailCard from "@/features/invoice/components/OrderDetailCard";
import PaymentSuccessCard from "@/features/invoice/components/PaymentSuccessCard";
import TopUpAgainBanner from "@/features/invoice/components/TopUpAgainBanner";
import { buildMockOrder } from "@/features/invoice/data/buildMockOrder";

export default function PaymentSuccessPage(): React.JSX.Element {
  const { invoiceNumber } = useParams({ strict: false }) as { invoiceNumber: string };
  const pendingOrder = useCheckoutStore((s) => s.pendingOrder);
  const { t } = useTranslation("invoice");

  const order = pendingOrder ?? buildMockOrder(invoiceNumber ?? "TOPUP-22052026-8F3A2B6C");

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* Hero — centered, full-width */}
      <Box className="flex flex-col items-center gap-6 px-4 pb-8">
        <PaymentSuccessHero />
      </Box>

      {/* Two-column content */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-10">
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Left column: order detail */}
          <Box>
            <OrderDetailCard order={order} />
          </Box>

          {/* Right column: success card + download invoice button */}
          <Box className="flex flex-col gap-4">
            <PaymentSuccessCard
              invoiceNumber={order.invoiceNumber}
              paymentName={order.paymentName}
            />

            {/* Download Invoice — secondary outlined button */}
            <Box className="flex justify-center">
              <Box
                as="button"
                type="button"
                onClick={() => {
                  // Placeholder: download will be wired once backend provides a file URL
                }}
                className="flex items-center gap-2 rounded-[50px] border border-white/15 bg-white/5 font-outfit font-semibold text-[13px] text-white/80 py-2.5 px-6 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <Download className="w-4 h-4 text-white/60" />
                <Text as="span" className="font-outfit text-[13px] text-white/80">
                  {t("success.downloadInvoice")}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* CTA banner */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <TopUpAgainBanner />
      </Box>

      <Footer />
    </Box>
  );
}

import React from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { RotateCw, CreditCard } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useTranslation } from "react-i18next";
import PaymentFailedHero from "@/features/invoice/components/PaymentFailedHero";
import OrderDetailCard from "@/features/invoice/components/OrderDetailCard";
import PaymentFailedCard from "@/features/invoice/components/PaymentFailedCard";
import NeedHelpBanner from "@/features/invoice/components/NeedHelpBanner";
import { useInvoiceQuery } from "@/features/invoice/hooks/useInvoiceQuery";
import { toOrder } from "@/features/invoice/lib/toOrder";

export default function PaymentFailedPage(): React.JSX.Element {
  const { invoiceNumber, locale } = useParams({ strict: false }) as {
    invoiceNumber: string;
    locale: string;
  };
  const pendingOrder = useCheckoutStore((s) => s.pendingOrder);
  const navigate = useNavigate();
  const { t } = useTranslation("invoice");

  // No review modal here: the API only accepts a rating for a COMPLETED
  // transaction, so asking on a failed payment could only ever 422 — and
  // "how was your experience?" is the wrong question for someone whose
  // payment just failed. Retry and NeedHelpBanner are what belong here.

  // Shares the invoice page's query key, so arriving here from the poll costs
  // no extra request.
  const { data: invoice } = useInvoiceQuery(invoiceNumber);

  const order = invoice
    ? toOrder(invoice)
    : pendingOrder?.invoiceNumber === invoiceNumber
      ? pendingOrder
      : null;

  const handleRetry = () => {
    // A failed order cannot be paid again — the customer starts a new one for
    // the same game rather than returning to a dead invoice.
    void navigate({
      to: invoice?.game?.slug ? "/$locale/checkout/$gameSlug" : "/$locale",
      params: { locale, gameSlug: invoice?.game?.slug ?? "" },
    });
  };

  if (!order) {
    return (
      <Box className="min-h-dvh bg-[#0A0A0C]">
        <Navbar />
        <Box className="flex flex-col items-center gap-6 px-4 py-20">
          <PaymentFailedHero />
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* Hero — centered, full-width */}
      <Box className="flex flex-col items-center gap-6 px-4 pb-8">
        <PaymentFailedHero />
      </Box>

      {/* Two-column content */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-10">
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Left column: order detail */}
          <Box>
            <OrderDetailCard order={order} />
          </Box>

          {/* Right column: failed card + retry buttons */}
          <Box className="flex flex-col gap-4">
            <PaymentFailedCard
              invoiceNumber={order.invoiceNumber}
              paymentName={order.paymentName}
              createdAt={order.createdAt}
              refund={invoice?.refund}
              locale={locale}
            />

            {/* Retry action buttons */}
            <Box className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Coba Lagi — secondary outlined */}
              <Box
                as="button"
                type="button"
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 rounded-[50px] border border-white/15 bg-white/5 font-outfit font-bold text-[13px] text-white/80 py-2.5 px-5 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <RotateCw className="w-4 h-4 text-white/60 shrink-0" />
                <Text as="span" className="font-outfit text-[13px] text-white/80 whitespace-nowrap">
                  {t("failed.retryPayment")}
                </Text>
              </Box>

              {/* Pilih Metode Pembayaran — gradient primary */}
              <Button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 text-[13px] py-2.5 px-5"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <Text as="span" className="font-outfit font-bold text-[13px] text-white whitespace-nowrap">
                  {t("failed.choosePaymentMethod")}
                </Text>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Help banner */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <NeedHelpBanner />
      </Box>

      <Footer />
    </Box>
  );
}

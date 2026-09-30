import React from "react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import PaymentSuccessHero from "@/features/invoice/components/PaymentSuccessHero";
import OrderDetailCard from "@/features/invoice/components/OrderDetailCard";
import PaymentSuccessCard from "@/features/invoice/components/PaymentSuccessCard";
import DownloadInvoiceButton from "@/features/invoice/components/DownloadInvoiceButton";
import TopUpAgainBanner from "@/features/invoice/components/TopUpAgainBanner";
import TransactionReviewModal from "@/features/invoice/components/TransactionReviewModal";
import { useDelayedModal } from "@/features/invoice/hooks/useDelayedModal";
import { useInvoiceQuery } from "@/features/invoice/hooks/useInvoiceQuery";
import { toOrder } from "@/features/invoice/lib/toOrder";

export default function PaymentSuccessPage(): React.JSX.Element {
  const { invoiceNumber } = useParams({ strict: false }) as { invoiceNumber: string };
  const pendingOrder = useCheckoutStore((s) => s.pendingOrder);
  // Keyed per invoice so dismissing the prompt for this order survives a
  // reload, while a later order still gets asked.
  const { isOpen: reviewOpen, close: closeReview } = useDelayedModal(
    undefined,
    `review-dismissed:${invoiceNumber}`,
  );

  // Same query key as the invoice page, so arriving here from the poll is a
  // cache hit and the card renders without a second round trip.
  const invoiceQuery = useInvoiceQuery(invoiceNumber);
  const invoice = invoiceQuery.data;

  const order = invoice
    ? toOrder(invoice)
    : pendingOrder?.invoiceNumber === invoiceNumber
      ? pendingOrder
      : null;

  if (!order) {
    const isLoading = invoiceQuery.isPending && invoiceQuery.fetchStatus !== "idle";

    return (
      <Box className="min-h-dvh bg-[rgb(0,0,0)]">
        <Navbar />
        <Box className="flex flex-col items-center gap-6 px-4 py-20">
          {invoiceQuery.isError ? (
            <ErrorState onRetry={() => void invoiceQuery.refetch()} />
          ) : isLoading ? (
            <Box aria-busy="true" className="w-full max-w-2xl">
              <Skeleton className="h-72 w-full rounded-2xl" />
            </Box>
          ) : (
            <PaymentSuccessHero />
          )}
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
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
              <DownloadInvoiceButton invoiceNumber={order.invoiceNumber} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* CTA banner */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <TopUpAgainBanner />
      </Box>

      <Footer />

      {/* Transaction review modal — auto-opens 15s after mount, once per invoice */}
      {reviewOpen && (
        <TransactionReviewModal
          onClose={closeReview}
          invoiceNumber={order.invoiceNumber}
        />
      )}
    </Box>
  );
}

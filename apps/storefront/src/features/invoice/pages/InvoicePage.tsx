import React, { useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import PaymentWaitingHero from "@/features/invoice/components/PaymentWaitingHero";
import CountdownCard from "@/features/invoice/components/CountdownCard";
import OrderDetailCard from "@/features/invoice/components/OrderDetailCard";
import PaymentInstructionsCard from "@/features/invoice/components/PaymentInstructionsCard";
import PaymentMethodCard from "@/features/invoice/components/PaymentMethodCard";
import { useInvoiceQuery } from "@/features/invoice/hooks/useInvoiceQuery";
import { useInvoiceRealtime } from "@/features/invoice/hooks/useInvoiceRealtime";
import { toOrder } from "@/features/invoice/lib/toOrder";

export default function InvoicePage(): React.JSX.Element {
  const { invoiceNumber, locale } = useParams({ strict: false }) as {
    invoiceNumber: string;
    locale: string;
  };
  const navigate = useNavigate();
  const pendingOrder = useCheckoutStore((s) => s.pendingOrder);

  const { data: invoice } = useInvoiceQuery(invoiceNumber);
  // Push updates over the public invoice channel; the poll above is the fallback.
  useInvoiceRealtime(invoiceNumber);

  // Payment is confirmed by a gateway webhook the browser cannot observe, so
  // the poll is what moves the customer on. Redirect once nothing more will
  // change.
  useEffect(() => {
    if (!invoice?.is_terminal) return;

    void navigate({
      to:
        invoice.status === "COMPLETED"
          ? "/$locale/invoice/$invoiceNumber/success"
          : "/$locale/invoice/$invoiceNumber/failed",
      params: { locale: locale ?? "id", invoiceNumber },
      replace: true,
    });
  }, [invoice?.is_terminal, invoice?.status, invoiceNumber, locale, navigate]);

  // The store seeds the first paint straight after checkout; the server's copy
  // replaces it as soon as the query resolves, and is the only source on a
  // direct visit or a refresh.
  const order = invoice
    ? toOrder(invoice)
    : pendingOrder?.invoiceNumber === invoiceNumber
      ? pendingOrder
      : null;

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* Hero + countdown — centered, full-width */}
      <Box className="flex flex-col items-center gap-6 px-4 pb-8">
        <PaymentWaitingHero />
        <CountdownCard expiresAt={invoice?.expires_at ?? null} />
      </Box>

      {/* Two-column content */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Left column: order detail + instructions */}
          <Box className="flex flex-col gap-5">
            {order && <OrderDetailCard order={order} />}
            <PaymentInstructionsCard />
          </Box>

          {/* Right column: payment method + QR */}
          <Box>
            {invoice && (
              <PaymentMethodCard
                invoiceNumber={invoice.invoice_number}
                paymentName={invoice.payment.channel ?? ""}
                instructions={invoice.payment.instructions}
                status={invoice.status}
                paidAt={invoice.payment.paid_at}
              />
            )}
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}

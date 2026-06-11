import React from "react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { useCheckoutStore, type PendingOrder } from "@/store/useCheckoutStore";
import PaymentWaitingHero from "@/features/invoice/components/PaymentWaitingHero";
import CountdownCard from "@/features/invoice/components/CountdownCard";
import OrderDetailCard from "@/features/invoice/components/OrderDetailCard";
import PaymentInstructionsCard from "@/features/invoice/components/PaymentInstructionsCard";
import PaymentMethodCard from "@/features/invoice/components/PaymentMethodCard";
import mlThumbnail from "@/assets/images/games/games_1.png";

// Static fallback that matches the design image exactly
// (used on direct visit / page refresh when store is empty)
function buildMockOrder(invoiceNumber: string): PendingOrder {
  return {
    invoiceNumber,
    gameName: "Mobile Legend",
    gameRegion: "Indonesia",
    gameThumbnail: mlThumbnail,
    packageLabel: "5 Diamond",
    userId: "337850017",
    serverId: "9423",
    username: "Ramonezz",
    paymentName: "QRIS",
    price: 1015,
    adminFee: 43,
    total: 1058,
    createdAt: Date.now(),
  };
}

export default function InvoicePage(): React.JSX.Element {
  const { invoiceNumber } = useParams({ strict: false }) as { invoiceNumber: string };
  const pendingOrder = useCheckoutStore((s) => s.pendingOrder);

  const order = pendingOrder ?? buildMockOrder(invoiceNumber ?? "TOPUP-22052026-8F3A2B6C");

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* Hero + countdown — centered, full-width */}
      <Box className="flex flex-col items-center gap-6 px-4 pb-8">
        <PaymentWaitingHero />
        <CountdownCard />
      </Box>

      {/* Two-column content */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Left column: order detail + instructions */}
          <Box className="flex flex-col gap-5">
            <OrderDetailCard order={order} />
            <PaymentInstructionsCard />
          </Box>

          {/* Right column: payment method + QR */}
          <Box>
            <PaymentMethodCard
              invoiceNumber={order.invoiceNumber}
              paymentName={order.paymentName}
            />
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}

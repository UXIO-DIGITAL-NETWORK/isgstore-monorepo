import React from "react";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import TrackOrderHero from "@/features/track-order/components/TrackOrderHero";
import TrackOrderSearchCard from "@/features/track-order/components/TrackOrderSearchCard";
import TrackOrderHelpBanner from "@/features/track-order/components/TrackOrderHelpBanner";
import TransactionTable from "@/features/track-order/components/TransactionTable";
import { useTrackOrderSearch } from "@/features/track-order/hooks/useTrackOrderSearch";

export default function TrackOrderPage(): React.JSX.Element {
  const { form, filteredRows, onSubmit } = useTrackOrderSearch();

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />

      {/* ── Hero ── */}
      <Box className="flex flex-col items-center px-4">
        <TrackOrderHero />
      </Box>

      {/* ── Search card + help banner ── */}
      <Box className="max-w-3xl mx-auto px-4 md:px-8 pb-8 flex flex-col gap-4">
        <TrackOrderSearchCard form={form} onSubmit={onSubmit} />
        <TrackOrderHelpBanner />
      </Box>

      {/* ── Transactions table ── */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <TransactionTable rows={filteredRows} />
      </Box>

      <Footer />
    </Box>
  );
}

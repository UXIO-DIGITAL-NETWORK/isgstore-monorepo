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
  const { form, filteredRows } = useTrackOrderSearch();

  // Live filtering is driven by form.watch() in useTrackOrderSearch.
  // The submit button provides explicit UX affordance but filtering is already live.
  const handleSearch = () => { /* no-op: live filtering via useWatch */ };

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* ── Hero ── */}
      <Box className="flex flex-col items-center px-4">
        <TrackOrderHero />
      </Box>

      {/* ── Search card + help banner ── */}
      <Box className="max-w-3xl mx-auto px-4 md:px-8 pb-8 flex flex-col gap-4">
        <TrackOrderSearchCard form={form} onSubmit={handleSearch} />
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

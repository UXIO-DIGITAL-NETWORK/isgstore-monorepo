import React from "react";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import PriceListHero from "@/features/price-list/components/PriceListHero";
import CategorySelector from "@/features/price-list/components/CategorySelector";
import PriceListToolbar from "@/features/price-list/components/PriceListToolbar";
import PriceTable from "@/features/price-list/components/PriceTable";
import PriceTablePagination from "@/features/price-list/components/PriceTablePagination";
import PriceListEmptyState from "@/features/price-list/components/PriceListEmptyState";
import { usePriceList } from "@/features/price-list/hooks/usePriceList";

export default function PriceListPage(): React.JSX.Element {
  const {
    form,
    pagedRows,
    activeGameId,
    setActiveGameId,
    sortOption,
    setSortOption,
    currentPage,
    setCurrentPage,
    totalPages,
    onQueryChange,
  } = usePriceList();

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* ── Hero ── */}
      <Box className="flex flex-col items-center px-4">
        <PriceListHero />
      </Box>

      {/* ── Main content ── */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-16 flex flex-col gap-0">
        {/* Category game selector */}
        <CategorySelector
          activeGameId={activeGameId}
          onSelect={setActiveGameId}
        />

        {activeGameId ? (
          <>
            {/* Sort + search toolbar */}
            <PriceListToolbar
              form={form}
              sortOption={sortOption}
              onSortChange={setSortOption}
              onQueryChange={onQueryChange}
            />

            {/* Price table */}
            <PriceTable rows={pagedRows} />

            {/* Pagination */}
            <PriceTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <PriceListEmptyState />
        )}
      </Box>

      <Footer />
    </Box>
  );
}

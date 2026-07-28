import { useCallback, useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { mainProductColumns } from "../components/mainProductColumns";
import { MainProductToolbar } from "../components/MainProductToolbar";
import { useDeleteProducts, useProductList } from "../hooks/useProducts";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Main Products list (product_requirements.md §4.6) — the first of the two
 * Product tabs, and the only one with a reference frame.
 *
 * Three corrections to that reference, all of them the same defect classes
 * confirmed across five Category references: the header subcopy is real copy
 * rather than "lorem ipsum dolor sit amet", the footer counts products rather
 * than the copy-pasted "9999999 transactions", and the column the reference
 * heads "Price" is named `Game` for what it actually contains.
 */
export default function MainProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [price, setPrice] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params = useMemo(
    () => ({ search: search || undefined, category, price, page, per_page: pageSize }),
    [search, category, price, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useProductList(params);
  const deleteProducts = useDeleteProducts();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string | undefined) => {
    setCategory(value);
    setPage(1);
  };

  const handlePriceChange = (value: string | undefined) => {
    setPrice(value);
    setPage(1);
  };

  // Stable identity: DataTable reports selection from an effect, so an inline
  // arrow here would re-run it on every render.
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Main Products
        </Heading>
        <Text variant="muted">
          The nominals buyers can purchase for each game, with their variants, pricing and storefront availability.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <MainProductToolbar
          search={search}
          onSearchChange={handleSearchChange}
          category={category}
          onCategoryChange={handleCategoryChange}
          price={price}
          onPriceChange={handlePriceChange}
          onRefresh={() => refetch()}
          selectedCount={selectedIds.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={mainProductColumns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          entityLabel="products"
          showRowNumber
          formatPageSizeLabel={(size) => `${size} Row`}
          onSelectionChange={handleSelectionChange}
          page={data?.meta.current_page ?? page}
          pageSize={data?.meta.per_page ?? pageSize}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.last_page ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>

      {/* Same dialog and same mutation as the row menu's Delete — only the set
          of ids differs, so only the wording is count-aware. */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={selectedIds.length <= 1 ? "Delete this product?" : `Delete ${selectedIds.length} products?`}
        description={
          selectedIds.length <= 1
            ? "This action cannot be undone. This will permanently delete this product and remove all of its variants from the storefront."
            : `This action cannot be undone. This will permanently delete these ${selectedIds.length} products and remove all of their variants from the storefront.`
        }
        onConfirm={() => deleteProducts.mutate(selectedIds)}
      />
    </Box>
  );
}

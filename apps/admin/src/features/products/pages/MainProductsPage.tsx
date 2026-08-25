import { useCallback, useMemo, useState } from "react";
import { Archive, Eye, Lock, RefreshCcw } from "lucide-react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { mainProductColumns } from "../components/mainProductColumns";
import { MainProductFormDialog } from "../components/MainProductFormDialog";
import { MainProductToolbar } from "../components/MainProductToolbar";
import {
  useDeleteProducts,
  useUxiotopupUpdateProducts,
  useLockProducts,
  useProductList,
  useSetProductPublished,
  useShowProducts,
} from "../hooks/useProducts";
import type { ProductListParams } from "../types/product.type";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Main Products list (product_requirements.md §4.6) — the first of the two
 * Product tabs, and the only one with a reference frame.
 *
 * Two corrections to that reference, both the same defect classes confirmed
 * across five Category references: the header subcopy is real copy rather than
 * "lorem ipsum dolor sit amet", and the footer counts products rather than the
 * copy-pasted "9999999 transactions".
 */
export default function MainProductsPage() {
  const [search, setSearch] = useState("");
  // A real category id now, not its name — see products.service `list()`.
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [price, setPrice] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [publishState, setPublishState] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkUnpublishOpen, setBulkUnpublishOpen] = useState(false);
  const [bulkLockOpen, setBulkLockOpen] = useState(false);
  const [bulkShowOpen, setBulkShowOpen] = useState(false);
  const [bulkUxiotopupOpen, setBulkUxiotopupOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(
    () => ({
      search: search || undefined,
      category_id: categoryId,
      price,
      publish_state: publishState as ProductListParams["publish_state"],
      page,
      per_page: pageSize,
    }),
    [search, categoryId, price, publishState, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useProductList(params);
  const deleteProducts = useDeleteProducts();
  const setProductPublished = useSetProductPublished();
  const lockProducts = useLockProducts();
  const showProducts = useShowProducts();
  const uxiotopupUpdate = useUxiotopupUpdateProducts();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string | undefined) => {
    setCategoryId(value);
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
          category={categoryId}
          onCategoryChange={handleCategoryChange}
          price={price}
          onPriceChange={handlePriceChange}
          onRefresh={() => refetch()}
          onAdd={() => setAddOpen(true)}
          selectedCount={selectedIds.length}
          onBulkUxiotopup={() => setBulkUxiotopupOpen(true)}
          onBulkShowPrice={() => setBulkShowOpen(true)}
          onBulkLock={() => setBulkLockOpen(true)}
          publishState={publishState}
          onPublishStateChange={(next) => {
            setPublishState(next);
            setPage(1);
          }}
          onBulkUnpublish={() => setBulkUnpublishOpen(true)}
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

      {/* Same dialog and same mutation as the row menu's Archive — only the set
          of ids differs, so only the wording is count-aware. */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        icon={<Archive />}
        confirmLabel="Archive"
        title={selectedIds.length <= 1 ? "Archive this product?" : `Archive ${selectedIds.length} products?`}
        description={
          selectedIds.length <= 1
            ? "It leaves the storefront and the catalogue, and its provider SKU returns to the pool. Past orders keep their details, and you can restore it from the Archived filter."
            : `These ${selectedIds.length} products leave the storefront and the catalogue, and their provider SKUs return to the pool. Past orders keep their details, and you can restore them from the Archived filter.`
        }
        onConfirm={() => deleteProducts.mutate(selectedIds)}
      />

      {/* Unpublishing is reversible, so the copy says what changes rather than
          warning it cannot be undone — but it still takes products off sale, so
          it goes through the same confirmation (`.claude/rules/rbac-security.md`).

          Unpublish-only on purpose, unlike the row menu's toggle: a selection can
          hold rows in any state, so there is no single one to invert. */}
      <DeleteConfirmDialog
        open={bulkUnpublishOpen}
        onOpenChange={setBulkUnpublishOpen}
        icon={<Archive />}
        confirmLabel="Unpublish"
        title={selectedIds.length <= 1 ? "Unpublish this product?" : `Unpublish ${selectedIds.length} products?`}
        description={
          selectedIds.length <= 1
            ? "It leaves the storefront and stops being orderable. You can publish it again at any time."
            : `These ${selectedIds.length} products leave the storefront and stop being orderable. You can publish them again at any time.`
        }
        onConfirm={() => setProductPublished.mutate({ ids: selectedIds, published: false })}
      />

      <DeleteConfirmDialog
        open={bulkUxiotopupOpen}
        onOpenChange={setBulkUxiotopupOpen}
        icon={<RefreshCcw />}
        confirmLabel="Update"
        title={selectedIds.length <= 1 ? "Update this product?" : `Update ${selectedIds.length} products?`}
        description="Re-pull selling prices from each product's supplier cost. Locked prices are left unchanged."
        onConfirm={() => uxiotopupUpdate.mutate(selectedIds)}
      />

      <DeleteConfirmDialog
        open={bulkShowOpen}
        onOpenChange={setBulkShowOpen}
        icon={<Eye />}
        confirmLabel="Show"
        title={selectedIds.length <= 1 ? "Show this price?" : `Show ${selectedIds.length} prices?`}
        description="The selected prices will be visible on the storefront."
        onConfirm={() => showProducts.mutate({ ids: selectedIds, hidden: false })}
      />

      <DeleteConfirmDialog
        open={bulkLockOpen}
        onOpenChange={setBulkLockOpen}
        icon={<Lock />}
        confirmLabel="Lock"
        title={selectedIds.length <= 1 ? "Lock this price?" : `Lock ${selectedIds.length} prices?`}
        description="The supplier sync will stop overwriting the selected prices until they are unlocked."
        onConfirm={() => lockProducts.mutate({ ids: selectedIds, locked: true })}
      />

      <MainProductFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </Box>
  );
}

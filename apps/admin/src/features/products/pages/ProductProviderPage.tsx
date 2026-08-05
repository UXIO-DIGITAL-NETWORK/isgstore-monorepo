import { useCallback, useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { AddProviderProductDialog } from "../components/AddProviderProductDialog";
import { BulkAddProviderDialog } from "../components/BulkAddProviderDialog";
import { ProviderToolbar } from "../components/ProviderToolbar";
import { providerColumns } from "../components/providerColumns";
import { useDigiflazzPriceList } from "../hooks/useProviderProducts";
import type { DigiflazzPriceListItem, DigiflazzType } from "../types/product.type";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Product Provider tab — browses the Digiflazz price list and adds SKUs into the
 * catalog. The list is served from the backend's shared 5-minute cache, so
 * paging/searching never hits Digiflazz upstream. Adding a SKU creates a
 * Product + Digiflazz mapping, which the storefront then serves automatically.
 */
export default function ProductProviderPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<DigiflazzType>("prepaid");
  const [onlyUnmapped, setOnlyUnmapped] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addTarget, setAddTarget] = useState<DigiflazzPriceListItem | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const params = useMemo(
    () => ({
      type,
      search: search || undefined,
      only_unmapped: onlyUnmapped || undefined,
      page,
      per_page: pageSize,
    }),
    [type, search, onlyUnmapped, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useDigiflazzPriceList(params);

  const resetToFirstPage = () => setPage(1);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    resetToFirstPage();
  };

  const handleTypeChange = (value: DigiflazzType) => {
    setType(value);
    resetToFirstPage();
  };

  const handleOnlyUnmappedChange = (value: boolean) => {
    setOnlyUnmapped(value);
    resetToFirstPage();
  };

  // Stable identity: DataTable reports selection from an effect, so an inline
  // arrow here would re-run it on every render.
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);

  const columns = useMemo(() => providerColumns((item) => setAddTarget(item)), []);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Product Provider
        </Heading>
        <Text variant="muted">
          The Digiflazz price list your supplier has published. Add any product into your catalog — it flows through to
          the storefront once its category is a sellable game.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <ProviderToolbar
          search={search}
          onSearchChange={handleSearchChange}
          type={type}
          onTypeChange={handleTypeChange}
          onlyUnmapped={onlyUnmapped}
          onOnlyUnmappedChange={handleOnlyUnmappedChange}
          onRefresh={() => refetch()}
          selectedCount={selectedIds.length}
          onBulkAdd={() => setBulkOpen(true)}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          entityLabel="products"
          showRowNumber
          enableSelection
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

      {/* Keyed by SKU so the form resets cleanly for each row. */}
      <AddProviderProductDialog
        key={addTarget?.buyer_sku_code}
        item={addTarget}
        open={Boolean(addTarget)}
        onOpenChange={(open) => !open && setAddTarget(null)}
      />

      <BulkAddProviderDialog
        skus={selectedIds}
        type={type}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onDone={() => setSelectedIds([])}
      />
    </Box>
  );
}

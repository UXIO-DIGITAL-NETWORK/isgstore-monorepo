import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Lock, Plus, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { BulkActionsMenu } from "@/components/common/BulkActionsMenu";
import { Can } from "@/components/common/Can";
import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { managedProviderColumns } from "../components/managedProviderColumns";
import {
  useBulkDeleteProviderProducts,
  useBulkLockProviderPrice,
  useProviderProductList,
} from "../hooks/useProviderProducts";
import type { ProviderProduct } from "../types/product.type";

const DEFAULT_PAGE_SIZE = 10;
const ALL = "all";

/**
 * Product Provider tab (redesigned) — the managed list of provider products
 * (supplier mappings) with their price breakdown, status and per-row actions.
 * Adding a provider still goes through the Uxiotopup price list, reached via
 * "Add Product Provider". System rows are protected: not selectable, no delete.
 */
export default function ManagedProviderPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [mode, setMode] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLockOpen, setBulkLockOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const bulkLock = useBulkLockProviderPrice();
  const bulkDelete = useBulkDeleteProviderProducts();

  const params = useMemo(
    () => ({
      search: search || undefined,
      status: status === ALL ? undefined : status,
      mode: mode === ALL ? undefined : mode,
      page,
      per_page: pageSize,
    }),
    [search, status, mode, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useProviderProductList(params);

  const resetToFirstPage = () => setPage(1);
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const canSelectRow = useCallback((row: ProviderProduct) => !row.is_system, []);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading level={1} variant="section">
          Product Provider
        </Heading>
        <Text variant="muted">
          The provider products mapped into your catalog. Lock a price to hold it against the supplier sync, tune its
          profit margin, or remove a mapping. System products are managed by the platform.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <Box className="flex flex-wrap items-center gap-3">
          <Input
            className="w-64 rounded-xl"
            placeholder="Search provider product"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-36 rounded-xl" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={mode}
            onValueChange={(v) => {
              setMode(v);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-36 rounded-xl" aria-label="Price mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All prices</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="rounded-xl" aria-label="Refresh" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Box className="ml-auto">
            <Can permission="products.create">
              <Button asChild className="rounded-xl">
                <Link to="/admin/products/provider/add">
                  <Plus className="size-4" />
                  Add Product Provider
                </Link>
              </Button>
            </Can>
          </Box>
        </Box>
      </Box>

      {selectedIds.length > 0 && (
        <Box className="flex justify-end">
          <BulkActionsMenu
            count={selectedIds.length}
            actions={[
              { label: "Lock Price", icon: <Lock className="size-4" />, onSelect: () => setBulkLockOpen(true) },
              {
                label: "Edit Profit Margin",
                icon: <SlidersHorizontal className="size-4" />,
                onSelect: () =>
                  navigate({
                    to: "/admin/products/provider/set-profit-margin",
                    search: { ids: selectedIds.join(",") },
                  }),
              },
              {
                label: "Delete",
                icon: <Trash2 className="size-4" />,
                destructive: true,
                onSelect: () => setBulkDeleteOpen(true),
              },
            ]}
          />
        </Box>
      )}

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={managedProviderColumns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          entityLabel="products"
          showRowNumber
          enableSelection
          canSelectRow={canSelectRow}
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

      <DeleteConfirmDialog
        open={bulkLockOpen}
        onOpenChange={setBulkLockOpen}
        icon={<Lock />}
        confirmLabel="Lock"
        title={selectedIds.length <= 1 ? "Lock this price?" : `Lock ${selectedIds.length} prices?`}
        description="The daily supplier sync will stop overwriting these products' prices until they are unlocked."
        onConfirm={() => bulkLock.mutate({ ids: selectedIds, locked: true })}
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={selectedIds.length <= 1 ? "Delete this provider product?" : `Delete ${selectedIds.length} provider products?`}
        description="This action cannot be undone. System provider products in the selection are skipped."
        onConfirm={() => bulkDelete.mutate(selectedIds)}
      />
    </Box>
  );
}

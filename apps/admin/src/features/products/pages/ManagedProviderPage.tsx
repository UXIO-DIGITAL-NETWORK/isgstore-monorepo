import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpCircle, Lock, Plus, RefreshCw, Rocket, SlidersHorizontal, Trash2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { managedProviderColumns } from "../components/managedProviderColumns";
import { useProductSelectOptions } from "../hooks/useProductSelectOptions";
import {
  usePoolSummary,
  usePromoteAndPublishProviderProducts,
  usePromoteProviderProducts,
} from "../hooks/useProviderPool";
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
 * Adding a provider still goes through the Uxiolabs price list, reached via
 * "Add Product Provider". System rows are protected: not selectable, no delete.
 */
export default function ManagedProviderPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [mode, setMode] = useState(ALL);
  const [poolState, setPoolState] = useState(ALL);
  const [availability, setAvailability] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLockOpen, setBulkLockOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const bulkLock = useBulkLockProviderPrice();
  const bulkDelete = useBulkDeleteProviderProducts();
  const promote = usePromoteProviderProducts();
  const promoteAndPublish = usePromoteAndPublishProviderProducts();
  const { data: poolSummary } = usePoolSummary();
  const { categoryOptions } = useProductSelectOptions();

  const params = useMemo(
    () => ({
      search: search || undefined,
      status: status === ALL ? undefined : status,
      mode: mode === ALL ? undefined : mode,
      pool_state: poolState === ALL ? undefined : poolState,
      availability: availability === ALL ? undefined : availability,
      category_id: categoryId === ALL ? undefined : categoryId,
      page,
      per_page: pageSize,
    }),
    [search, status, mode, poolState, availability, categoryId, page, pageSize],
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
          <Select
            value={poolState}
            onValueChange={(v) => {
              setPoolState(v);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-40 rounded-xl" aria-label="Pipeline stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All stages</SelectItem>
              <SelectItem value="needs_margin">Needs margin</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              {/* No Draft or Published here: both describe a SKU that has been
                  promoted, and a promoted SKU has left the pool. It lives on the
                  Main Products list, whose Status filter covers those states. */}
            </SelectContent>
          </Select>
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-44 rounded-xl" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={availability}
            onValueChange={(v) => {
              setAvailability(v);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-44 rounded-xl" aria-label="Provider availability">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any availability</SelectItem>
              <SelectItem value="available">Available upstream</SelectItem>
              <SelectItem value="unavailable">Unavailable upstream</SelectItem>
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
                  {/* How many SKUs the provider publishes that are not pooled yet —
                      the only prompt that new catalogue has appeared upstream. */}
                  {(poolSummary?.new_count ?? 0) > 0 && (
                    <Badge variant="secondary" className="ml-1.5 tabular-nums">
                      {poolSummary?.new_count}
                    </Badge>
                  )}
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
                label: "Promote to Main Product",
                icon: <ArrowUpCircle className="size-4" />,
                onSelect: () => promote.mutate(selectedIds),
              },
              {
                label: "Promote & Publish",
                icon: <Rocket className="size-4" />,
                onSelect: () => promoteAndPublish.mutate(selectedIds),
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

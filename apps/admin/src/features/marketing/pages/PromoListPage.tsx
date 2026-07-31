import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { MarketingListShell } from "../components/MarketingListShell";
import { MarketingToolbar } from "../components/MarketingToolbar";
import { promoColumns } from "../components/marketingColumns";
import { usePromoList, useDeletePromos } from "../hooks/usePromos";

const DEFAULT_PAGE_SIZE = 10;

export function PromoListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params = useMemo(() => ({ search: search || undefined, page, per_page: pageSize }), [search, page, pageSize]);
  const { data, isLoading, isError, refetch } = usePromoList(params);
  const deleteRows = useDeletePromos();

  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const columns = useMemo(() => promoColumns((ids) => deleteRows.mutate(ids)), [deleteRows]);

  return (
    <>
      <MarketingListShell
        title="Promo"
        description="Discount codes. Public codes appear in the storefront's voucher list; private ones still work when typed."
        toolbar={
          <MarketingToolbar
            idPrefix="promo"
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onRefresh={() => refetch()}
            selectedCount={selectedIds.length}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            searchPlaceholder="Search codes"
            addLabel="Add Promo"
          />
        }
        table={
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel="promos"
            emptyMessage="No promo codes yet."
            showRowNumber
            enableSelection
            onSelectionChange={handleSelectionChange}
            page={page}
            pageSize={pageSize}
            total={data?.meta.total ?? 0}
            lastPage={data?.meta.last_page ?? 1}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} ${selectedIds.length === 1 ? "item" : "items"}?`}
        description="This action cannot be undone."
        onConfirm={() => deleteRows.mutate(selectedIds)}
      />
    </>
  );
}

export default PromoListPage;

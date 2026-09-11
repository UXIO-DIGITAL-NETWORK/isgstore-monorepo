import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { FlashSaleFormDialog } from "../components/FlashSaleFormDialog";
import { MarketingListShell } from "../components/MarketingListShell";
import { MarketingToolbar } from "../components/MarketingToolbar";
import { flashSaleColumns } from "../components/marketingColumns";
import { useFlashSaleList, useDeleteFlashSales } from "../hooks/useFlashSales";

const DEFAULT_PAGE_SIZE = 10;

export function FlashSaleListPage() {
  const { t } = useTranslation("marketing");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const params = useMemo(() => ({ search: search || undefined, page, per_page: pageSize }), [search, page, pageSize]);
  const { data, isLoading, isError, refetch } = useFlashSaleList(params);
  const deleteRows = useDeleteFlashSales();

  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const columns = useMemo(
    () => flashSaleColumns((ids) => deleteRows.mutate(ids), (id) => setEditId(id), t),
    [deleteRows, t],
  );

  return (
    <>
      <MarketingListShell
        title={t("flashSaleEntity")}
        description={t("flashSaleSubtitle")}
        toolbar={
          <MarketingToolbar
            idPrefix="flash-sale"
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onRefresh={() => refetch()}
            selectedCount={selectedIds.length}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onAdd={() => setAddOpen(true)}
            searchPlaceholder="Search flash sales"
            addLabel="Add Flash Sale"
          />
        }
        table={
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel={t("flashSalesEntity")}
            emptyMessage={t("noFlashSales")}
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
        description={t("irreversible")}
        onConfirm={() => deleteRows.mutate(selectedIds)}
      />

      <FlashSaleFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <FlashSaleFormDialog
        open={editId !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditId(undefined);
        }}
        flashSaleId={editId}
      />
    </>
  );
}

export default FlashSaleListPage;

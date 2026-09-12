import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { MarketingListShell } from "../components/MarketingListShell";
import { MarketingToolbar } from "../components/MarketingToolbar";
import { PromoFormDialog } from "../components/PromoFormDialog";
import { promoColumns } from "../components/marketingColumns";
import { usePromoList, useDeletePromos } from "../hooks/usePromos";

const DEFAULT_PAGE_SIZE = 10;

export function PromoListPage() {
  const { t } = useTranslation("marketing");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const params = useMemo(() => ({ search: search || undefined, page, per_page: pageSize }), [search, page, pageSize]);
  const { data, isLoading, isError, refetch } = usePromoList(params);
  const deleteRows = useDeletePromos();

  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const columns = useMemo(
    () => promoColumns((ids) => deleteRows.mutate(ids), (id) => setEditId(id), t),
    [deleteRows, t],
  );

  return (
    <>
      <MarketingListShell
        title={t("promoEntity")}
        description={t("promoSubtitle")}
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
            onAdd={() => setAddOpen(true)}
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
            entityLabel={t("promosEntity")}
            emptyMessage={t("noPromos")}
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

      <PromoFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <PromoFormDialog
        open={editId !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditId(undefined);
        }}
        promoId={editId}
      />
    </>
  );
}

export default PromoListPage;

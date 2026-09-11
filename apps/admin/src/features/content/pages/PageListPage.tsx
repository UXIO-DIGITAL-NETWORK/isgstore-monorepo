import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ContentListShell } from "../components/ContentListShell";
import { ContentToolbar } from "../components/ContentToolbar";
import { PageFormDialog } from "../components/PageFormDialog";
import { pageColumns } from "../components/contentColumns";
import { usePageList, useDeletePages } from "../hooks/usePages";

const DEFAULT_PAGE_SIZE = 10;

export function PageListPage() {
  const { t } = useTranslation("content");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const params = useMemo(
    () => ({ search: search || undefined, page, per_page: pageSize }),
    [search, page, pageSize],
  );

  const { data, isLoading, isError, refetch } = usePageList(params);
  const deleteRows = useDeletePages();

  // Stable identity: DataTable reports selection from an effect.
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);

  const columns = useMemo(
    () => pageColumns((ids) => deleteRows.mutate(ids), (id) => setEditId(id), t),
    [deleteRows, t],
  );

  return (
    <>
      <ContentListShell
        title={t("tabPages")}
        description={t("pagesSubtitle")}
        toolbar={
          <ContentToolbar
            idPrefix="page"
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onRefresh={() => refetch()}
            selectedCount={selectedIds.length}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onAdd={() => setAddOpen(true)}
            searchPlaceholder="Search pages"
            addLabel="Add Page"
          />
        }
        table={
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel={t("pagesEntity")}
            emptyMessage={t("pagesEmpty")}
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

      <PageFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <PageFormDialog
        open={editId !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditId(undefined);
        }}
        pageId={editId}
      />
    </>
  );
}

export default PageListPage;

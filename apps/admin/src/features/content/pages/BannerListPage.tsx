import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { BannerFormDialog } from "../components/BannerFormDialog";
import { ContentListShell } from "../components/ContentListShell";
import { ContentToolbar } from "../components/ContentToolbar";
import { bannerColumns } from "../components/contentColumns";
import { useBannerList, useDeleteBanners } from "../hooks/useBanners";

const DEFAULT_PAGE_SIZE = 10;

export function BannerListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const params = useMemo(() => ({ search: search || undefined, page, per_page: pageSize }), [search, page, pageSize]);
  const { data, isLoading, isError, refetch } = useBannerList(params);
  const deleteRows = useDeleteBanners();

  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const columns = useMemo(
    () => bannerColumns((ids) => deleteRows.mutate(ids), (id) => setEditId(id)),
    [deleteRows],
  );

  return (
    <>
      <ContentListShell
        title="Banners"
        description="Hero slides shown on the storefront homepage. A banner with no image is hidden automatically."
        toolbar={
          <ContentToolbar
            idPrefix="banner"
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onRefresh={() => refetch()}
            selectedCount={selectedIds.length}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onAdd={() => setAddOpen(true)}
            searchPlaceholder="Search banners"
            addLabel="Add Banner"
          />
        }
        table={
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel="banners"
            emptyMessage="No banners yet."
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
        description="This action cannot be undone. The selected rows will be removed from the storefront."
        onConfirm={() => deleteRows.mutate(selectedIds)}
      />

      <BannerFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <BannerFormDialog
        open={editId !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditId(undefined);
        }}
        bannerId={editId}
      />
    </>
  );
}

export default BannerListPage;

import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ContentListShell } from "../components/ContentListShell";
import { ContentToolbar } from "../components/ContentToolbar";
import { articleCategoryColumns } from "../components/contentColumns";
import { useArticleCategoryList, useDeleteArticleCategories } from "../hooks/useArticleCategories";

const DEFAULT_PAGE_SIZE = 10;

export function ArticleCategoryListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params = useMemo(
    () => ({ search: search || undefined, page, per_page: pageSize }),
    [search, page, pageSize],
  );

  const { data, isLoading, isError, refetch } = useArticleCategoryList(params);
  const deleteRows = useDeleteArticleCategories();

  // Stable identity: DataTable reports selection from an effect.
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);

  const columns = useMemo(() => articleCategoryColumns((ids) => deleteRows.mutate(ids)), [deleteRows]);

  return (
    <>
      <ContentListShell
        title="Article Categories"
        description="The category pills the storefront filters articles by. The key is the stable identifier."
        toolbar={
          <ContentToolbar
            idPrefix="article-category"
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onRefresh={() => refetch()}
            selectedCount={selectedIds.length}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            searchPlaceholder="Search categories"
            addLabel="Add Category"
          />
        }
        table={
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel="categories"
            emptyMessage="No categories yet."
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
    </>
  );
}

export default ArticleCategoryListPage;

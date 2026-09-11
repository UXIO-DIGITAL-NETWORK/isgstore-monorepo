import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { SubCategoryFormDialog } from "../components/SubCategoryFormDialog";
import { SubCategoryToolbar } from "../components/SubCategoryToolbar";
import { subCategoryColumnsFor } from "../components/subCategoryColumns";
import { useDeleteSubCategories, useSubCategoryList } from "../hooks/useSubCategories";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Sub Category list (product_requirements.md §4.5, lines 206-208). The
 * reference's header subcopy is the same "lorem ipsum dolot sit amet"
 * placeholder as the Category tab — real copy is written here instead.
 */
export default function SubCategoryPage() {
  const { t } = useTranslation("categories");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(
    () => ({ search: search || undefined, category_id: categoryId, page, per_page: pageSize }),
    [search, categoryId, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useSubCategoryList(params);
  const deleteSubCategories = useDeleteSubCategories();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string | undefined) => {
    setCategoryId(value);
    setPage(1);
  };

  // Stable identity: DataTable reports selection from an effect, so an
  // inline arrow here would re-run it on every render.
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >{t("tabSubCategory")}</Heading>
        <Text variant="muted">{t("subSubtitle")}</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <SubCategoryToolbar
          search={search}
          onSearchChange={handleSearchChange}
          categoryId={categoryId}
          onCategoryChange={handleCategoryChange}
          onRefresh={() => refetch()}
          onAdd={() => setAddOpen(true)}
          selectedCount={selectedIds.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={subCategoryColumnsFor(t)}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyMessage={t("subEmpty")}
          entityLabel={t("subEntity")}
          showRowNumber
          onSelectionChange={handleSelectionChange}
          page={data?.meta.current_page ?? page}
          pageSize={data?.meta.per_page ?? pageSize}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.last_page ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>

      {/* Same dialog and same mutation as the row menu's Delete — only the
          set of ids differs (§4.5, line 214), so only the wording is
          count-aware. */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={selectedIds.length <= 1 ? "Delete this sub category?" : `Delete ${selectedIds.length} sub categories?`}
        description={
          selectedIds.length <= 1
            ? "This action cannot be undone. This will permanently delete this sub category and remove it from the storefront."
            : `This action cannot be undone. This will permanently delete these ${selectedIds.length} sub categories and remove them from the storefront.`
        }
        onConfirm={() => deleteSubCategories.mutate(selectedIds)}
      />

      <SubCategoryFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </Box>
  );
}

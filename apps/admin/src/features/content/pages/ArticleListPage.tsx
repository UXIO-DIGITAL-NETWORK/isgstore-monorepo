import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { SelectField } from "@/components/common/SelectField";
import { ArticleFormDialog } from "../components/ArticleFormDialog";
import { ContentListShell } from "../components/ContentListShell";
import { ContentToolbar } from "../components/ContentToolbar";
import { articleColumns } from "../components/contentColumns";
import { useArticleCategoryOptions } from "../hooks/useArticleCategories";
import { useArticleList, useDeleteArticles } from "../hooks/useArticles";
import type { ArticleType } from "../types/content.type";

const DEFAULT_PAGE_SIZE = 10;
const ALL = "all";

interface ArticleListPageProps {
  /** Articles and News are the same table filtered by type — the API stores
   * them in one place because they differ only in where they surface. */
  type: ArticleType;
}

export function ArticleListPage({ type }: ArticleListPageProps) {
  const { t } = useTranslation("content");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const { options: categoryOptions } = useArticleCategoryOptions();

  const params = useMemo(
    () => ({
      search: search || undefined,
      type,
      article_category_id: categoryId === ALL ? undefined : categoryId,
      page,
      per_page: pageSize,
    }),
    [search, type, categoryId, page, pageSize],
  );

  const { data, isLoading, isError, refetch } = useArticleList(params);
  const deleteArticles = useDeleteArticles();

  // Stable identity: DataTable reports selection from an effect, so an inline
  // arrow would re-run it on every render.
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);

  const columns = useMemo(
    () => articleColumns((ids) => deleteArticles.mutate(ids), (id) => setEditId(id), t),
    [deleteArticles, t],
  );

  const isNews = type === "news";

  return (
    <>
      <ContentListShell
        title={isNews ? "News" : "Articles"}
        description={
          isNews
            ? "Announcements and updates shown on the storefront's news feed."
            : "Guides and editorial content shown on the storefront."
        }
        toolbar={
          <ContentToolbar
            idPrefix={type}
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onRefresh={() => refetch()}
            selectedCount={selectedIds.length}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onAdd={() => setAddOpen(true)}
            searchPlaceholder={isNews ? "Search news" : "Search articles"}
            addLabel={isNews ? "Add News" : "Add Article"}
            filters={
              <Box className="w-56">
                <SelectField
                  id={`${type}-category-filter`}
                  label={t("category")}
                  options={[{ value: ALL, label: t("allCategories") }, ...categoryOptions]}
                  value={categoryId}
                  onChange={(value) => {
                    setCategoryId(value);
                    setPage(1);
                  }}
                />
              </Box>
            }
          />
        }
        table={
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel={isNews ? "news" : "articles"}
            emptyMessage={isNews ? "No news yet." : "No articles yet."}
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
        description={t("articleIrreversible")}
        onConfirm={() => deleteArticles.mutate(selectedIds)}
      />

      <ArticleFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        type={type}
      />

      <ArticleFormDialog
        open={editId !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditId(undefined);
        }}
        type={type}
        articleId={editId}
      />
    </>
  );
}

export default ArticleListPage;

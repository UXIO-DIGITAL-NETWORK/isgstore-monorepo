import { useCallback, useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { DataTable } from "@/components/common/DataTable";
import { CategoryProviderFormDialog } from "../components/CategoryProviderFormDialog";
import { CategoryProviderToolbar } from "../components/CategoryProviderToolbar";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { categoryProviderColumns } from "../components/categoryProviderColumns";
import { useCategoryList } from "../hooks/useCategories";
import { useCategoryProviderList, useDeleteCategoryProviders } from "../hooks/useCategoryProviders";

const DEFAULT_PAGE_SIZE = 10;
const CATEGORY_OPTIONS_PAGE_SIZE = 100;

/**
 * Category Provider list (product_requirements.md §4.5, lines 239-246) — the
 * fifth and last tab, which completes this feature. The reference's header
 * subcopy is the same "lorem ipsum dolot sit amet" placeholder as every other
 * tab; real copy is written here instead, and the footer counts "category
 * providers" rather than the copy-pasted "9999999 transactions".
 *
 * No Status column and no deactivate action: none of the five reference
 * images shows either, and §6 line 286 confirms the entity has no status
 * field. The Figma frame could not be checked (the MCP server's token is
 * expired), so this follows the references rather than inventing a status
 * concept the design does not have.
 */
export default function CategoryProviderPage() {
  const [search, setSearch] = useState("");
  const [providerName, setProviderName] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(
    () => ({ search: search || undefined, provider_name: providerName, page, per_page: pageSize }),
    [search, providerName, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useCategoryProviderList(params);
  const deleteCategoryProviders = useDeleteCategoryProviders();

  // The Category column stores a `category_id`; resolving it needs the
  // Category tab's own records. ponytail: one page is plenty against mock
  // data — swap to a batched lookup if the real list grows.
  const { data: categories } = useCategoryList({ per_page: CATEGORY_OPTIONS_PAGE_SIZE });
  const columns = useMemo(
    () => categoryProviderColumns(new Map((categories?.data ?? []).map((category) => [category.id, category.name]))),
    [categories],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleProviderChange = (value: string | undefined) => {
    setProviderName(value);
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
        >
          Category Provider
        </Heading>
        <Text variant="muted">
          Which upstream supplier fulfils each category, and the integration template used to route its orders.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <CategoryProviderToolbar
          search={search}
          onSearchChange={handleSearchChange}
          providerName={providerName}
          onProviderChange={handleProviderChange}
          onRefresh={() => refetch()}
          onAdd={() => setAddOpen(true)}
          selectedCount={selectedIds.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyMessage="No category providers found."
          entityLabel="category providers"
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

      {/* Same dialog and same mutation as the row menu's Delete — only the set
          of ids differs (§4.5 line 245), so only the wording is count-aware.
          The reference shows the shadcn "permanently delete your account"
          boilerplate for the fifth time; this passes real copy into the
          already-fixed shared component rather than re-solving it. */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={
          selectedIds.length <= 1
            ? "Delete this category provider?"
            : `Delete ${selectedIds.length} category providers?`
        }
        description={
          selectedIds.length <= 1
            ? "This action cannot be undone. This will permanently delete this category provider and unlink the supplier from this category."
            : `This action cannot be undone. This will permanently delete these ${selectedIds.length} category providers and unlink those suppliers from their categories.`
        }
        onConfirm={() => deleteCategoryProviders.mutate(selectedIds)}
      />

      <CategoryProviderFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </Box>
  );
}

import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { DataTable } from "@/components/common/DataTable";
import { CategoryServerFormDialog } from "../components/CategoryServerFormDialog";
import { CategoryServerToolbar } from "../components/CategoryServerToolbar";
import { categoryServerColumnsFor } from "../components/categoryServerColumns";
import { useCategoryServerList } from "../hooks/useCategoryServers";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Category Server list (product_requirements.md §4.5, lines 229-233).
 * Renamed from "Server Category" on 2026-07-28: the reference's tab bar and
 * its own page header disagreed, and the page-level name won.
 *
 * The simplest list in this feature — three columns, no status, no
 * selection, and a two-item row menu.
 */
export default function CategoryServerPage() {
  const { t } = useTranslation("categories");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(() => ({ search: search || undefined, page, per_page: pageSize }), [search, page, pageSize]);
  const { data, isLoading, isError, refetch } = useCategoryServerList(params);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >{t("tabCategoryServer")}</Heading>
        <Text variant="muted">{t("serverSubtitle")}</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <CategoryServerToolbar
          search={search}
          onSearchChange={handleSearchChange}
          onRefresh={() => refetch()}
          onAdd={() => setAddOpen(true)}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={categoryServerColumnsFor(t)}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyMessage={t("serverEmpty")}
          entityLabel={t("serverEntity")}
          showRowNumber
          enableSelection={false}
          page={data?.meta.current_page ?? page}
          pageSize={data?.meta.per_page ?? pageSize}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.last_page ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>

      <CategoryServerFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </Box>
  );
}

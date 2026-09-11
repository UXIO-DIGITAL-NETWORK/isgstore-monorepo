import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { DataTable } from "@/components/common/DataTable";
import { CategoryTypeFormDialog } from "../components/CategoryTypeFormDialog";
import { CategoryTypeToolbar } from "../components/CategoryTypeToolbar";
import { categoryTypeColumnsFor } from "../components/categoryTypeColumns";
import { useCategoryTypeList } from "../hooks/useCategoryTypes";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Category Type list (product_requirements.md §4.5). The reference's header
 * subcopy is the same "lorem ipsum dolot sit amet" placeholder every tab
 * carries — real copy is written here instead.
 *
 * No row selection or bulk delete: the reference shows neither, and status
 * changes happen one row at a time through the action menu.
 */
export default function CategoryTypePage() {
  const { t } = useTranslation("categories");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(() => ({ search: search || undefined, page, per_page: pageSize }), [search, page, pageSize]);
  const { data, isLoading, isError, refetch } = useCategoryTypeList(params);

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
        >{t("colCategoryType")}</Heading>
        <Text variant="muted">{t("typeSubtitle")}</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <CategoryTypeToolbar
          search={search}
          onSearchChange={handleSearchChange}
          onRefresh={() => refetch()}
          onAdd={() => setAddOpen(true)}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={categoryTypeColumnsFor(t)}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyMessage={t("typeEmpty")}
          entityLabel={t("typeEntity")}
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

      <CategoryTypeFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </Box>
  );
}

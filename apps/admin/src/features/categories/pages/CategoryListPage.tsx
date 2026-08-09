import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { categoryColumns } from "../components/categoryColumns";
import { DataTable } from "@/components/common/DataTable";
import { CategoryFormDialog } from "../components/CategoryFormDialog";
import { CategoryToolbar } from "../components/CategoryToolbar";
import { useCategoryList } from "../hooks/useCategories";

const DEFAULT_PAGE_SIZE = 10;

export default function CategoryListPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(
    () => ({ search: search || undefined, type, page, per_page: pageSize }),
    [search, type, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useCategoryList(params);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeChange = (value: string | undefined) => {
    setType(value);
    setPage(1);
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Category
        </Heading>
        <Text variant="muted">Groups games and products so they can be organized and found on the storefront.</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <CategoryToolbar
          search={search}
          onSearchChange={handleSearchChange}
          type={type}
          onTypeChange={handleTypeChange}
          onRefresh={() => refetch()}
          onAdd={() => setAddOpen(true)}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={categoryColumns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          entityLabel="categories"
          page={data?.meta.current_page ?? page}
          pageSize={data?.meta.per_page ?? pageSize}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.last_page ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>

      <CategoryFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </Box>
  );
}

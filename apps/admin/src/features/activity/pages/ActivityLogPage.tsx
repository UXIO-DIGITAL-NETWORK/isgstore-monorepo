import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activityColumns } from "../components/activityColumns";
import { useActivityLogs } from "../hooks/useActivityLogs";

const DEFAULT_PAGE_SIZE = 15;

/**
 * Activity Log — the admin-wide audit feed (`GET /v1/activity-logs`). Read-only:
 * every row is written by the backend across auth, transactions and admin CRUD,
 * so the page only browses (search + paginate); it never mutates.
 */
export default function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = useMemo(
    () => ({ search: search || undefined, page, per_page: pageSize }),
    [search, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useActivityLogs(params);

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
        >
          Activity
        </Heading>
        <Text variant="muted">
          Every logged action across the platform — sign-ins, transactions, and admin changes — newest first.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <Box className="flex flex-col gap-1.5 pb-4">
          <Label htmlFor="activity-search">Search</Label>
          <Box className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="activity-search"
              className="w-64 rounded-xl pl-8"
              placeholder="Search message"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </Box>
        </Box>

        <DataTable
          columns={activityColumns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          entityLabel="activity"
          showRowNumber
          page={data?.meta.current_page ?? page}
          pageSize={data?.meta.per_page ?? pageSize}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.last_page ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>
    </Box>
  );
}

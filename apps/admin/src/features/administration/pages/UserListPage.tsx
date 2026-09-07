import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/currency";
import { UserRowActions } from "../components/UserRowActions";
import { useUserList } from "../hooks/useAdministration";
import type { AdminUser } from "../types/administration.type";

const DEFAULT_PAGE_SIZE = 10;

export function UserListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = useMemo(
    () => ({ search: search || undefined, page, per_page: pageSize, role: "admin" }),
    [search, page, pageSize],
  );
  const { data, isLoading, isError, refetch } = useUserList(params);

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <Box className="flex flex-col">
            <Text
              as="span"
              className="font-medium"
            >
              {row.original.name}
            </Text>
            <Text
              variant="muted"
              as="span"
            >
              {row.original.email}
            </Text>
          </Box>
        ),
      },
      { accessorKey: "phone", header: "Phone", cell: ({ row }) => <Text as="span">{row.original.phone}</Text> },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="capitalize"
          >
            {row.original.role ?? "—"}
          </Badge>
        ),
      },
      {
        id: "balance",
        header: "Balance",
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {formatCurrency(row.original.balance, { fractionDigits: 0 })}
          </Text>
        ),
      },
      {
        id: "point",
        header: "Points",
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {row.original.point}
          </Text>
        ),
      },
      {
        id: "verified",
        header: "Verified",
        cell: ({ row }) => (
          <Text
            as="span"
            variant={row.original.email_verified_at ? "default" : "muted"}
          >
            {row.original.email_verified_at ? "Yes" : "No"}
          </Text>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "active" ? "outline" : "destructive"}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => <UserRowActions user={row.original} />,
      },
    ],
    [],
  );

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Users
        </Heading>
        <Text variant="muted">
          Admin accounts for this dashboard, their wallet balance and account standing. Balance adjustments are audited
          and require a reason; suspend or ban blocks an account from transacting.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="user-search">Search</Label>
          <Input
            id="user-search"
            className="w-64 rounded-xl"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </Box>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          entityLabel="users"
          emptyMessage="No users yet."
          showRowNumber
          enableSelection={false}
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
      </Box>
    </Box>
  );
}

export default UserListPage;

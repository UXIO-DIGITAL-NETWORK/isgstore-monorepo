import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { DataTable } from "@/components/common/DataTable";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { useDeleteMembershipTier, useMembershipTierList } from "../hooks/useMembership";
import type { MembershipTier } from "../types/membership.type";

const DEFAULT_PAGE_SIZE = 10;

export function MembershipListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [deleteTier, setDeleteTier] = useState<MembershipTier | null>(null);

  const params = useMemo(() => ({ page, per_page: pageSize }), [page, pageSize]);
  const { data, isLoading, isError, refetch } = useMembershipTierList(params);
  const deleteMutation = useDeleteMembershipTier();

  const columns = useMemo<ColumnDef<MembershipTier>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tier",
        cell: ({ row }) => (
          <Text
            as="span"
            className="font-medium"
          >
            {row.original.name}
          </Text>
        ),
      },
      {
        id: "min_spend",
        header: "Min. Spend",
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {formatCurrency(row.original.min_spend, { fractionDigits: 0 })}
          </Text>
        ),
      },
      {
        id: "discount",
        header: "Discount",
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {row.original.discount_percent}%
          </Text>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(row.original.is_active ? "text-success" : "text-muted-foreground")}
          >
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${row.original.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl"
            >
              <Can permission="memberships.delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteTier(row.original)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Box className="flex flex-col gap-6">
        <Box className="rounded-2xl border border-border bg-card p-6">
          <Heading
            level={1}
            variant="section"
          >
            Membership
          </Heading>
          <Text variant="muted">
            Loyalty tiers, their spend threshold and member discount. Tier configuration is a first slice — the add/edit
            form follows once the loyalty rules are confirmed.
          </Text>
        </Box>

        <Box className="rounded-2xl border border-border bg-card p-4">
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel="tiers"
            emptyMessage="No membership tiers yet."
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

      <DeleteConfirmDialog
        open={deleteTier !== null}
        onOpenChange={(open) => !open && setDeleteTier(null)}
        title={`Delete ${deleteTier?.name ?? "tier"}?`}
        description="This permanently removes the membership tier. This action cannot be undone."
        onConfirm={() => deleteTier && deleteMutation.mutate(deleteTier.id)}
      />
    </>
  );
}

export default MembershipListPage;

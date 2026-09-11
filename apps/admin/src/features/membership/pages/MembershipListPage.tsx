import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

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
import { MembershipPlanFormDialog } from "../components/MembershipPlanFormDialog";
import {
  useCreateMembershipPlan,
  useDeleteMembershipPlan,
  useMembershipPlanList,
  useUpdateMembershipPlan,
} from "../hooks/useMembership";
import type { MembershipPlan } from "../types/membership.type";

const DEFAULT_PAGE_SIZE = 10;

export function MembershipListPage() {
  const { t } = useTranslation("membership");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [deletePlan, setDeletePlan] = useState<MembershipPlan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);

  const params = useMemo(() => ({ page, per_page: pageSize }), [page, pageSize]);
  const { data, isLoading, isError, refetch } = useMembershipPlanList(params);
  const createPlan = useCreateMembershipPlan();
  const updatePlan = useUpdateMembershipPlan();
  const deletePlanMutation = useDeleteMembershipPlan();

  const openAdd = () => {
    setEditPlan(null);
    setFormOpen(true);
  };
  const openEdit = (plan: MembershipPlan) => {
    setEditPlan(plan);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<MembershipPlan>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("colPlan"),
        cell: ({ row }) => (
          <Box className="flex flex-col">
            <Text
              as="span"
              className="font-medium"
            >
              {row.original.name}
            </Text>
            <Text
              as="span"
              variant="muted"
            >
              {row.original.code}
            </Text>
          </Box>
        ),
      },
      {
        id: "price",
        header: t("price"),
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {formatCurrency(row.original.price, { fractionDigits: 0 })}
          </Text>
        ),
      },
      {
        id: "duration",
        header: t("colDuration"),
        // A null duration is a plan that never expires — printing "null days"
        // (or the 0 the API used to coerce it to) reads as a broken row.
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {row.original.duration_days === null ? "Lifetime" : `${row.original.duration_days} days`}
          </Text>
        ),
      },
      {
        id: "status",
        header: t("colStatus"),
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
        header: t("colAction"),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl"
                size="icon-sm"
                aria-label={`Actions for ${row.original.name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl"
            >
              <Can permission="memberships.edit">
                <DropdownMenuItem onSelect={() => openEdit(row.original)}>
                  <Pencil />{t("edit")}</DropdownMenuItem>
              </Can>
              <Can permission="memberships.delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeletePlan(row.original)}
                >
                  <Trash2 />{t("delete")}</DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t],
  );

  return (
    <>
      <Box className="flex flex-col gap-6">
        <Box className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6">
          <Box>
            <Heading
              level={1}
              variant="section"
            >{t("title")}</Heading>
            <Text variant="muted">{t("subtitle")}</Text>
          </Box>
          <Can permission="memberships.create">
            <Button
              className="rounded-xl"
              onClick={openAdd}
            >
              <Plus />{t("addPlan")}</Button>
          </Can>
        </Box>

        <Box className="rounded-2xl border border-border bg-card p-4">
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel={t("entity")}
            emptyMessage={t("empty")}
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

      <MembershipPlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editPlan}
        isPending={createPlan.isPending || updatePlan.isPending}
        onSubmit={(values) =>
          editPlan ? updatePlan.mutate({ id: editPlan.id, input: values }) : createPlan.mutate(values)
        }
      />

      <DeleteConfirmDialog
        open={deletePlan !== null}
        onOpenChange={(open) => !open && setDeletePlan(null)}
        title={`Delete ${deletePlan?.name ?? "plan"}?`}
        description={t("deleteDescription")}
        onConfirm={() => deletePlan && deletePlanMutation.mutate(deletePlan.id)}
      />
    </>
  );
}

export default MembershipListPage;

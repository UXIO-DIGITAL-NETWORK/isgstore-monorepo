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
import { formatCurrency } from "@/utils/currency";
import { PricingRuleFormDialog } from "../components/PricingRuleFormDialog";
import {
  useCategoryOptions,
  usePlanOptions,
  useCreatePricingRule,
  useDeletePricingRule,
  usePricingRules,
  useUpdatePricingRule,
} from "../hooks/usePricing";
import type { PricingRule } from "../types/pricingRule.type";

export function PricingRulesPage() {
  const { t } = useTranslation("pricing");
  const { data: rules, isLoading, isError, refetch } = usePricingRules();
  const { data: categoryOptions = [] } = useCategoryOptions();
  const { data: planOptions = [] } = usePlanOptions();
  const createRule = useCreatePricingRule();
  const updateRule = useUpdatePricingRule();
  const deleteRuleMutation = useDeletePricingRule();

  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<PricingRule | null>(null);
  const [deleteRule, setDeleteRule] = useState<PricingRule | null>(null);

  const openAdd = () => {
    setEditRule(null);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<PricingRule>[]>(
    () => [
      {
        accessorKey: "membership_plan_id",
        header: t("membershipPlan"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="capitalize"
          >
            {/* No plan means the rule is the fallback every unpriced tier
                uses — worth naming rather than showing an empty cell. */}
            {row.original.plan_name ?? t("allPlans")}
          </Badge>
        ),
      },
      {
        id: "category",
        header: t("category"),
        cell: ({ row }) => <Text as="span">{row.original.category_name ?? t("allCategories")}</Text>,
      },
      {
        id: "markup_percent",
        header: t("markupPercent"),
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {row.original.markup_percent}%
          </Text>
        ),
      },
      {
        id: "markup_flat",
        header: t("colFlat"),
        cell: ({ row }) => (
          <Text
            as="span"
            className="tabular-nums"
          >
            {formatCurrency(row.original.markup_flat, { fractionDigits: 0 })}
          </Text>
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
                aria-label={`Actions for ${row.original.plan_name ?? "all plans"} rule`}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl"
            >
              <Can permission="pricing.manage">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditRule(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil />{t("edit")}</DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteRule(row.original)}
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

  const list = rules ?? [];

  return (
    <>
      <Box className="flex flex-col gap-6">
        <Box className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6">
          <Box>
            <Heading
              level={1}
              variant="section"
            >{t("title")}</Heading>
            <Text variant="muted">
              Markup applied over supplier cost per membership plan (optionally per category). These drive the suggested prices
              when adding products.
            </Text>
          </Box>
          <Can permission="pricing.manage">
            <Button
              className="rounded-xl"
              onClick={openAdd}
            >
              <Plus />{t("addRule")}</Button>
          </Can>
        </Box>

        <Box className="rounded-2xl border border-border bg-card p-4">
          <DataTable
            columns={columns}
            data={list}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel={t("entity")}
            emptyMessage={t("empty")}
            showRowNumber
            enableSelection={false}
            page={1}
            pageSize={Math.max(list.length, 1)}
            total={list.length}
            lastPage={1}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
          />
        </Box>
      </Box>

      <PricingRuleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editRule}
        categoryOptions={categoryOptions}
        planOptions={planOptions}
        isPending={createRule.isPending || updateRule.isPending}
        onSubmit={(input) => (editRule ? updateRule.mutate({ id: editRule.id, input }) : createRule.mutate(input))}
      />

      <DeleteConfirmDialog
        open={deleteRule !== null}
        onOpenChange={(open) => !open && setDeleteRule(null)}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        onConfirm={() => deleteRule && deleteRuleMutation.mutate(deleteRule.id)}
      />
    </>
  );
}

export default PricingRulesPage;

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useMerchantMutations } from "../hooks/useMerchant";
import type { MerchantMutation } from "../types/merchant.type";

/**
 * A factory rather than a module constant: column headers are rendered text, so
 * they have to be resolved when the component renders, not frozen at import.
 */
const columnsFor = (t: TFunction<"merchant">): Column<MerchantMutation>[] => [
  { key: "created", header: t("mutations.colDate"), cell: (r) => formatDateTime(r.created_at) },
  { key: "type", header: t("mutations.colType"), cell: (r) => <Text as="span" className="uppercase">{r.type}</Text> },
  { key: "ref", header: t("mutations.colReference"), cell: (r) => r.reference ?? "-" },
  {
    key: "amount",
    header: t("mutations.colAmount"),
    className: "text-right tabular-nums",
    cell: (r) => (
      <Text as="span" className={cn(r.amount < 0 ? "text-destructive" : "text-success")}>
        {formatCurrency(r.amount, { fractionDigits: 0 })}
      </Text>
    ),
  },
  {
    key: "balance",
    header: t("mutations.colBalanceAfter"),
    className: "text-right tabular-nums",
    cell: (r) => formatCurrency(r.balance_after, { fractionDigits: 0 }),
  },
  { key: "desc", header: t("mutations.colDescription"), cell: (r) => r.description ?? "-" },
];

export default function MerchantMutationsPage() {
  const { t } = useTranslation("merchant");
  const columns = columnsFor(t);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMerchantMutations({ page, per_page: 20 });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("mutations.title")}</Heading>
      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        rowKey={(r) => r.id}
      />
      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </Box>
  );
}

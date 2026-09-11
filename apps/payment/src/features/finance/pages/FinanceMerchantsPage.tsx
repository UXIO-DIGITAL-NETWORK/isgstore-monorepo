import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useFinanceMerchants } from "../hooks/useFinance";
import type { FinanceMerchant } from "../types/finance.type";

/**
 * A factory rather than a module constant: column headers are rendered text, so
 * they have to resolve when the component renders.
 */
const columnsFor = (t: TFunction<"finance">): Column<FinanceMerchant>[] => [
  { key: "name", header: t("merchants.colName"), cell: (r) => <Text as="span" className="font-medium">{r.name}</Text> },
  { key: "email", header: t("merchants.colEmail"), cell: (r) => r.email },
  { key: "phone", header: t("merchants.colPhone"), cell: (r) => r.phone ?? "-" },
  { key: "status", header: t("merchants.colStatus"), cell: (r) => <StatusBadge status={String(r.status).toUpperCase()} /> },
  { key: "balance", header: t("merchants.colBalance"), className: "text-right tabular-nums", cell: (r) => formatCurrency(r.balance, { fractionDigits: 0 }) },
  { key: "created", header: t("merchants.colJoined"), cell: (r) => formatDateTime(r.created_at) },
];

export default function FinanceMerchantsPage() {
  const { t } = useTranslation("finance");
  const columns = columnsFor(t);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFinanceMerchants({ page, per_page: 20 });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("merchants.title")}</Heading>
      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("merchants.empty")}
        rowKey={(r) => r.id}
      />
      <Pager page={data?.page ?? page} lastPage={data?.lastPage ?? 1} total={data?.total ?? 0} onPageChange={setPage} />
    </Box>
  );
}

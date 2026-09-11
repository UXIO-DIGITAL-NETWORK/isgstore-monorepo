import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { ServiceInvoice } from "@/types/service.type";

import { useServiceInvoices } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

/** "" = all; the rest map straight onto ListParams.status. */
const FILTERS = [
  { value: "", labelKey: "invoices.filterAll" },
  { value: "WAITING_CONFIRMATION", labelKey: "invoices.filterWaiting" },
  { value: "UNPAID", labelKey: "invoices.filterUnpaid" },
  { value: "PAID", labelKey: "invoices.filterPaid" },
  { value: "REJECTED", labelKey: "invoices.filterRejected" },
];

/**
 * A factory rather than a module constant: column headers are rendered text, so
 * they have to resolve when the component renders.
 */
const columnsFor = (t: TFunction<"finance">): Column<ServiceInvoice>[] => [
  {
    key: "invoice",
    header: t("invoices.colInvoice"),
    cell: (r) => (
      <Text
        as="span"
        className="font-medium"
      >
        {r.invoice_number}
      </Text>
    ),
  },
  { key: "merchant", header: t("invoices.colClient"), cell: (r) => r.merchant?.name ?? "-" },
  { key: "service", header: t("invoices.colService"), cell: (r) => r.service_name },
  { key: "amount", header: t("invoices.colAmount"), className: "text-right tabular-nums", cell: (r) => money(r.amount) },
  { key: "status", header: t("invoices.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
  {
    key: "method",
    header: t("invoices.colMethod"),
    cell: (r) =>
      r.payment?.channel ?? (
        <Text
          as="span"
          className="text-muted-foreground"
        >
          —
        </Text>
      ),
  },
  { key: "due", header: t("invoices.colDue"), cell: (r) => formatDateTime(r.due_at) },
  {
    key: "actions",
    header: t("invoices.colAction"),
    // Every row is inspectable now: preparation, confirmation and rejection all
    // live on the detail page, so even a settled invoice is worth opening.
    cell: (r) => (
      <Button
        asChild
        size="sm"
        variant="outline"
      >
        <Link href={`/app/payment-internal/invoices/${r.id}`}>{t("invoices.detail")}</Link>
      </Button>
    ),
  },
];

export default function FinanceInvoicesPage() {
  const { t } = useTranslation("finance");
  const columns = columnsFor(t);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, isLoading, isError } = useServiceInvoices({
    page,
    per_page: 20,
    ...(status ? { status } : {}),
  });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("invoices.title")}</Heading>

      <Tabs
        value={status}
        onValueChange={(next) => {
          setStatus(next);
          // A filter change re-scopes the list, so page 3 of the old filter is
          // meaningless against the new one.
          setPage(1);
        }}
      >
        <TabsList>
          {FILTERS.map((filter) => (
            <TabsTrigger
              key={filter.value || "all"}
              value={filter.value}
            >
              {t(filter.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("invoices.empty")}
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

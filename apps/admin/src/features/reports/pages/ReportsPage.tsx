import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { DateField } from "@/components/common/DateField";
import { Heading } from "@/components/common/Heading";
import { StatCard } from "@/components/common/StatCard";
import { Text } from "@/components/common/Text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency } from "@/utils/currency";
import { useReportSummary } from "../hooks/useReports";
import type { ReportBreakdownRow, ReportPeriod, ReportSummaryParams } from "../types/report.type";

// `labelKey`, not `label`: a module constant would freeze whichever language
// was loaded at import.
const PERIOD_TABS: { value: ReportPeriod; labelKey: string }[] = [
  { value: "daily", labelKey: "daily" },
  { value: "monthly", labelKey: "monthly" },
  { value: "yearly", labelKey: "yearly" },
  { value: "custom", labelKey: "range" },
];

/** Fallback caption while the API's server-resolved label is in flight. */
const FALLBACK_CAPTION: Record<ReportPeriod, string> = {
  daily: "Today",
  monthly: "This month",
  yearly: "This year",
  custom: "Selected range",
};

function BreakdownTable({ title, rows, emptyLabel }: { title: string; rows: ReportBreakdownRow[]; emptyLabel: string }) {
  const { t } = useTranslation("reports");
  return (
    <Box className="rounded-2xl border border-border bg-card p-4">
      {rows.length === 0 ? (
        <Text
          variant="muted"
          className="py-8 text-center"
        >
          {emptyLabel}
        </Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{title}</TableHead>
              <TableHead className="text-right">{t("count")}</TableHead>
              <TableHead className="text-right">{t("revenue")}</TableHead>
              <TableHead className="text-right">{t("profit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.profit === undefined ? "—" : formatCurrency(row.profit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

export function ReportsPage() {
  const { t } = useTranslation("reports");
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);

  const params = useMemo<ReportSummaryParams>(() => ({ period, dateFrom, dateTo }), [period, dateFrom, dateTo]);
  const { data, isLoading, isError, error, refetch } = useReportSummary(params);

  const needsRange = period === "custom" && (!dateFrom || !dateTo);
  const caption = data?.label ?? FALLBACK_CAPTION[period];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >{t("title")}</Heading>
        <Text variant="muted">
          Consolidated revenue, transaction volume and profit, with a breakdown per product and payment channel. All figures follow WIB (GMT+7).
        </Text>
      </Box>

      <Box className="flex flex-col gap-4">
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as ReportPeriod)}
        >
          <TabsList>
            {PERIOD_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
              >
                {t(tab.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {period === "custom" && (
          <Box className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:max-w-xl">
            <DateField
              id="report-date-from"
              label={t("firstDate")}
              value={dateFrom}
              onChange={setDateFrom}
            />
            <DateField
              id="report-date-to"
              label={t("lastDate")}
              value={dateTo}
              onChange={setDateTo}
            />
          </Box>
        )}
      </Box>

      {needsRange ? (
        <Text
          variant="muted"
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >{t("pickDates")}</Text>
      ) : isError ? (
        <Box className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8">
          {/* Surface the API's own message: a 422 here is usually an inverted
              or over-long range, and "Couldn't load the report" hides the fix. */}
          <Text variant="muted">{getApiErrorMessage(error, "Couldn't load the report.")}</Text>
          <button
            type="button"
            className="rounded-xl border border-border px-3 py-1.5 text-sm"
            onClick={() => refetch()}
          >{t("retry")}</button>
        </Box>
      ) : isLoading || !data ? (
        <Text
          variant="muted"
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >{t("loading")}</Text>
      ) : (
        <>
          <Box className="grid gap-4 sm:grid-cols-3">
            <StatCard
              data={{
                id: "revenue",
                label: t("totalRevenue"),
                value: data.totals.revenue,
                caption,
              }}
            />
            <StatCard
              data={{
                id: "transactions",
                label: t("transactions"),
                value: data.totals.transactions,
                format: "count",
                caption: t("completedTransactions"),
              }}
            />
            <StatCard
              data={{
                id: "profit",
                label: t("netProfit"),
                value: data.totals.profit,
                caption: t("marginAfterCosts"),
              }}
            />
          </Box>

          <BreakdownTable
            title={t("product")}
            rows={data.breakdown}
            emptyLabel={t("noTransactionsInPeriod")}
          />
          <BreakdownTable
            title={t("paymentChannel")}
            rows={data.channels ?? []}
            emptyLabel={t("noPaymentsInPeriod")}
          />
        </>
      )}
    </Box>
  );
}

export default ReportsPage;

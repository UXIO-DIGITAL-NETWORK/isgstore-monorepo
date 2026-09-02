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

const PERIOD_TABS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Range" },
];

/** Fallback caption while the API's server-resolved label is in flight. */
const FALLBACK_CAPTION: Record<ReportPeriod, string> = {
  daily: "Today",
  monthly: "This month",
  yearly: "This year",
  custom: "Selected range",
};

function BreakdownTable({ title, rows, emptyLabel }: { title: string; rows: ReportBreakdownRow[]; emptyLabel: string }) {
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
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Profit</TableHead>
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
        >
          Reports
        </Heading>
        <Text variant="muted">
          Consolidated revenue, transaction volume and profit, with a breakdown per product and payment channel.
          {data?.timezone ? ` All figures follow your timezone (${data.timezone}).` : ""}
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
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {period === "custom" && (
          <Box className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:max-w-xl">
            <DateField
              id="report-date-from"
              label="First date"
              value={dateFrom}
              onChange={setDateFrom}
            />
            <DateField
              id="report-date-to"
              label="Last date"
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
        >
          Pick a first and last date to run the report.
        </Text>
      ) : isError ? (
        <Box className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8">
          {/* Surface the API's own message: a 422 here is usually an inverted
              or over-long range, and "Couldn't load the report" hides the fix. */}
          <Text variant="muted">{getApiErrorMessage(error, "Couldn't load the report.")}</Text>
          <button
            type="button"
            className="rounded-xl border border-border px-3 py-1.5 text-sm"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </Box>
      ) : isLoading || !data ? (
        <Text
          variant="muted"
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >
          Loading report…
        </Text>
      ) : (
        <>
          <Box className="grid gap-4 sm:grid-cols-3">
            <StatCard
              data={{
                id: "revenue",
                label: "Total Revenue",
                value: data.totals.revenue,
                caption,
              }}
            />
            <StatCard
              data={{
                id: "transactions",
                label: "Transactions",
                value: data.totals.transactions,
                format: "count",
                caption: "Completed transactions",
              }}
            />
            <StatCard
              data={{
                id: "profit",
                label: "Net Profit",
                value: data.totals.profit,
                caption: "Margin after costs",
              }}
            />
          </Box>

          <BreakdownTable
            title="Product"
            rows={data.breakdown}
            emptyLabel="No transactions in this period."
          />
          <BreakdownTable
            title="Payment Channel"
            rows={data.channels ?? []}
            emptyLabel="No payments in this period."
          />
        </>
      )}
    </Box>
  );
}

export default ReportsPage;

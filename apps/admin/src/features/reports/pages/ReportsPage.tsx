import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { StatCard } from "@/components/common/StatCard";
import { Text } from "@/components/common/Text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/currency";
import { useReportSummary } from "../hooks/useReports";
import type { ReportPeriod } from "../types/report.type";

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const { data, isLoading, isError, refetch } = useReportSummary(period);

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
        </Text>
      </Box>

      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as ReportPeriod)}
      >
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {isError ? (
        <Box className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8">
          <Text variant="muted">Couldn't load the report.</Text>
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
                caption: `This ${period === "daily" ? "day" : "month"}`,
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

          <Box className="rounded-2xl border border-border bg-card p-4">
            {data.breakdown.length === 0 ? (
              <Text
                variant="muted"
                className="py-8 text-center"
              >
                No transactions in this period.
              </Text>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Breakdown</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.breakdown.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export default ReportsPage;

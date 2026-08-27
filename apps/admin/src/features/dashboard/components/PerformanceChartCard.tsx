import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartSeries } from "../hooks/useDashboard";
import { MONTH_OPTIONS } from "../types/dashboard.type";
import type { MonthOption } from "../types/dashboard.type";

/** Derived from the canonical list, so the selector can never fall behind it. */
const MONTH_CHOICES: { value: MonthOption; label: string }[] = MONTH_OPTIONS.map((value) => ({
  value,
  label: `${value.charAt(0).toUpperCase()}${value.slice(1)}`,
}));

/** The month an operator almost always wants first is the one they are in. */
const currentMonth = (): MonthOption => MONTH_OPTIONS[new Date().getMonth()];

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  netIncome: { label: "Net Income", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function PerformanceChartCard() {
  const [month, setMonth] = useState<MonthOption>(currentMonth);
  const { data, isLoading, isError, refetch } = useChartSeries(month);

  const chartData = useMemo(
    () => (data ?? []).map((point) => ({ ...point, label: format(new Date(point.date), "MMM d") })),
    [data],
  );

  return (
    <Box
      as="section"
      aria-label="Monthly Performance"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
    >
      <Box className="flex items-start justify-between gap-4">
        <Box className="flex flex-col gap-1">
          <Heading
            level={3}
            variant="section"
            className="text-lg"
          >
            Monthly Performance
          </Heading>
          <Text variant="small">Daily revenue movement, taller areas indicate days with the best revenue.</Text>
        </Box>
        <Select
          value={month}
          onValueChange={(value) => setMonth(value as MonthOption)}
        >
          <SelectTrigger
            size="sm"
            className="w-[130px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_CHOICES.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Box>

      {isError ? (
        <Box className="flex h-[280px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border">
          <Text variant="muted">Failed to load performance data.</Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </Box>
      ) : isLoading ? (
        <Skeleton className="h-[280px] w-full" />
      ) : (
        <ChartContainer
          config={chartConfig}
          className="h-[280px] w-full"
        >
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="revenue"
              type="natural"
              fill="var(--color-revenue)"
              fillOpacity={0.3}
              stroke="var(--color-revenue)"
            />
            <Area
              dataKey="netIncome"
              type="natural"
              fill="var(--color-netIncome)"
              fillOpacity={0.3}
              stroke="var(--color-netIncome)"
            />
          </AreaChart>
        </ChartContainer>
      )}

      <Box className="flex items-center gap-4 text-xs text-muted-foreground">
        <Box className="flex items-center gap-1.5">
          <Box className="size-2 rounded-full bg-chart-1" />
          <Text as="span">Revenue</Text>
        </Box>
        <Box className="flex items-center gap-1.5">
          <Box className="size-2 rounded-full bg-chart-2" />
          <Text as="span">Net Income</Text>
        </Box>
      </Box>
    </Box>
  );
}

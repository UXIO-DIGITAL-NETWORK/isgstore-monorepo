import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { TrendPill } from "./TrendPill";
import type { StatCardData } from "../types/dashboard.type";

interface StatCardProps {
  data: StatCardData;
}

export function StatCard({ data }: StatCardProps) {
  const { label, value, deltaPct, direction, caption } = data;

  return (
    <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <Box className="flex items-center justify-between gap-2">
        <Text
          as="span"
          variant="small"
          className="font-medium text-muted-foreground"
        >
          {label}
        </Text>
        <TrendPill
          direction={direction}
          deltaPct={deltaPct}
        />
      </Box>
      <Text
        as="div"
        className="text-3xl font-semibold tabular-nums text-foreground"
      >
        {formatCurrency(value)}
      </Text>
      <Text variant="small">{caption}</Text>
    </Box>
  );
}

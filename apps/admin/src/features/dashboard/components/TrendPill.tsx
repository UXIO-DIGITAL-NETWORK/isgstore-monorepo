import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "../types/dashboard.type";

const trendPillVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
  {
    variants: {
      direction: {
        up: "bg-success/10 text-success",
        down: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      direction: "up",
    },
  },
);

interface TrendPillProps extends VariantProps<typeof trendPillVariants> {
  direction: TrendDirection;
  deltaPct: number;
  className?: string;
}

/** Sign follows `direction`, not the raw (always-positive) fixture value. */
export function TrendPill({ direction, deltaPct, className }: TrendPillProps) {
  const sign = direction === "up" ? "+" : "-";
  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <Box
      as="span"
      className={cn(trendPillVariants({ direction }), className)}
    >
      <Icon className="size-3" />
      <Text
        as="span"
        className="text-xs text-current"
      >{`${sign}${deltaPct}%`}</Text>
    </Box>
  );
}

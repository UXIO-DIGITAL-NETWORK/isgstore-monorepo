import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStatusCounts } from "../hooks/useTransactions";
import type { StatusCounts, TransactionStatus } from "../types/transaction.type";

const PILLS: {
  status: TransactionStatus;
  label: string;
  tooltip: string;
  countKey: keyof StatusCounts;
  borderClass: string;
  ringClass: string;
}[] = [
  {
    status: "pending",
    label: "Pending",
    tooltip: "Invoice paid but not yet processed by supplier",
    countKey: "pending",
    borderClass: "border-warning",
    ringClass: "ring-warning/40 bg-warning/10",
  },
  {
    status: "partial_refund",
    label: "Partial Refund",
    tooltip: "Some item refunded, other still in progress",
    countKey: "partial_refund",
    borderClass: "border-chart-1",
    ringClass: "ring-chart-1/40 bg-chart-1/10",
  },
  {
    status: "partial_success",
    label: "Partial Success",
    tooltip: "Some item succeeded, other still in progress",
    countKey: "partial_success",
    borderClass: "border-destructive",
    ringClass: "ring-destructive/40 bg-destructive/10",
  },
];

interface StatusPillsProps {
  active: TransactionStatus | null;
  onToggle: (status: TransactionStatus) => void;
}

/**
 * Clickable status-count filter chips above the transactions table
 * (product_requirements.md §4.3), restyled as a full-width 1x3 stat-card
 * grid — each cell color-coded per status via the design system's
 * success/destructive/chart-1 tokens plus the new `--warning` amber token
 * (design_system.md §3, 2026-07-10 revision).
 */
export function StatusPills({ active, onToggle }: StatusPillsProps) {
  const { data: counts } = useStatusCounts();

  return (
    <Box className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {PILLS.map((pill) => {
        const isActive = active === pill.status;
        return (
          <Tooltip key={pill.status}>
            <TooltipTrigger asChild>
              <Box
                as="button"
                type="button"
                onClick={() => onToggle(pill.status)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border-2 bg-card p-4 text-left transition-colors",
                  pill.borderClass,
                  isActive && pill.ringClass,
                )}
              >
                <Text
                  as="span"
                  variant="small"
                  className="font-medium text-foreground"
                >
                  {pill.label}
                </Text>
                <Text
                  as="span"
                  className="text-2xl font-semibold tabular-nums text-foreground"
                >
                  {counts ? counts[pill.countKey] : "–"}
                </Text>
              </Box>
            </TooltipTrigger>
            <TooltipContent>{pill.tooltip}</TooltipContent>
          </Tooltip>
        );
      })}
    </Box>
  );
}

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStatusCounts } from "../hooks/useTransactions";
import type { TransactionStatus } from "../types/transaction.type";

const PILLS: {
  status: TransactionStatus;
  label: string;
  tooltip: string;
  countKey: "pending" | "processing" | "failed";
  borderClass: string;
  bgClass: string;
  hoverBgClass: string;
  activeClass: string;
}[] = [
  {
    status: "pending",
    label: "Pending",
    tooltip: "Invoice paid but not yet processed by supplier",
    countKey: "pending",
    borderClass: "border-warning",
    bgClass: "bg-warning/10",
    hoverBgClass: "hover:bg-warning/15",
    activeClass: "bg-warning/20 ring-2 ring-warning/30",
  },
  {
    status: "processing",
    label: "Processing",
    tooltip: "Paid and handed to the supplier, awaiting fulfilment",
    countKey: "processing",
    borderClass: "border-chart-1",
    bgClass: "bg-chart-1/10",
    hoverBgClass: "hover:bg-chart-1/15",
    activeClass: "bg-chart-1/20 ring-2 ring-chart-1/30",
  },
  {
    status: "failed",
    label: "Failed",
    tooltip: "Customer paid but the supplier could not fulfil the order",
    countKey: "failed",
    borderClass: "border-destructive",
    bgClass: "bg-destructive/10",
    hoverBgClass: "hover:bg-destructive/15",
    activeClass: "bg-destructive/20 ring-2 ring-destructive/30",
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
                  "flex items-center justify-between gap-2 rounded-2xl border-2 p-4 text-left transition-colors duration-200",
                  pill.borderClass,
                  isActive ? pill.activeClass : cn(pill.bgClass, pill.hoverBgClass),
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

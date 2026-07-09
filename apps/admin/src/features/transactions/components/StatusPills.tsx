import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStatusCounts } from "../hooks/useTransactions";
import type { StatusCounts, TransactionStatus } from "../types/transaction.type";

const PILLS: { status: TransactionStatus; label: string; tooltip: string; countKey: keyof StatusCounts }[] = [
  {
    status: "pending",
    label: "Pending",
    tooltip: "Invoice paid but not yet processed by supplier",
    countKey: "pending",
  },
  {
    status: "partial_refund",
    label: "Partial Refund",
    tooltip: "Some item refunded, other still in progress",
    countKey: "partial_refund",
  },
  {
    status: "partial_success",
    label: "Partial Success",
    tooltip: "Some item succeeded, other still in progress",
    countKey: "partial_success",
  },
];

interface StatusPillsProps {
  active: TransactionStatus | null;
  onToggle: (status: TransactionStatus) => void;
}

/** Clickable status-count filter chips above the transactions table (product_requirements.md §4.3). */
export function StatusPills({ active, onToggle }: StatusPillsProps) {
  const { data: counts } = useStatusCounts();

  return (
    <Box className="flex flex-wrap gap-2">
      {PILLS.map((pill) => (
        <Tooltip key={pill.status}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={active === pill.status ? "default" : "outline"}
              size="sm"
              className="tabular-nums"
              onClick={() => onToggle(pill.status)}
            >
              {pill.label} ({counts ? counts[pill.countKey] : "–"})
            </Button>
          </TooltipTrigger>
          <TooltipContent>{pill.tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </Box>
  );
}

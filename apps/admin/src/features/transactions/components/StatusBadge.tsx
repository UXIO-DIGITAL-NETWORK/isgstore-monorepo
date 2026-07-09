import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "../types/transaction.type";

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  success: "Success",
  failed: "Failed",
  partial_refund: "Partial Refund",
  partial_success: "Partial Success",
};

// Monochrome by rule — color only via text-success/text-destructive, every
// other status stays neutral/muted (design_system.md §3).
const STATUS_TEXT_CLASS: Record<TransactionStatus, string> = {
  pending: "text-muted-foreground",
  processing: "text-muted-foreground",
  success: "text-success",
  failed: "text-destructive",
  partial_refund: "text-muted-foreground",
  partial_success: "text-muted-foreground",
};

interface StatusBadgeProps {
  status: TransactionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_TEXT_CLASS[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

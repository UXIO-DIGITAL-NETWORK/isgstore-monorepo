import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "../types/transaction.type";

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  success: "Success",
  failed: "Failed",
  refunded: "Refunded",
  partial_success: "Partial Success",
};

// Monochrome by rule — color only via text-success/text-warning/text-destructive,
// every other status stays neutral/muted (design_system.md §3). The border
// always matches the text color (not the Badge `outline` variant's neutral
// `border-border` default) so the pill reads as one consistent color, not a
// colored label inside a gray outline.
const STATUS_BADGE_CLASS: Record<TransactionStatus, string> = {
  pending: "text-muted-foreground border-border",
  processing: "text-warning border-warning",
  success: "text-success border-success",
  failed: "text-destructive border-destructive",
  refunded: "text-muted-foreground border-border",
  partial_success: "text-muted-foreground border-border",
};

interface StatusBadgeProps {
  status: TransactionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_BADGE_CLASS[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

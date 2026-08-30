import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RefundMethod, RefundStatus } from "../types/refund.type";

const STATUS_LABELS: Record<RefundStatus, string> = {
  // "Waiting for details" reads as what the operator is actually blocked on;
  // the API's WAITING_DETAILS is the same thing said in enum.
  WAITING_DETAILS: "Awaiting details",
  PENDING: "Ready to transfer",
  PROCESSING: "In progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

// Monochrome by rule — color only via text-success/text-warning/text-destructive,
// everything else stays neutral (design_system.md §3). Border matches text so
// the pill reads as one color rather than a tinted label in a gray outline.
const STATUS_BADGE_CLASS: Record<RefundStatus, string> = {
  WAITING_DETAILS: "text-muted-foreground border-border",
  // The only state that needs an operator to act, so it is the only one that
  // earns a color in the list.
  PENDING: "text-warning border-warning",
  PROCESSING: "text-warning border-warning",
  COMPLETED: "text-success border-success",
  REJECTED: "text-destructive border-destructive",
};

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_BADGE_CLASS[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

const METHOD_LABELS: Record<RefundMethod, string> = {
  balance: "To balance",
  manual_transfer: "Manual transfer",
  legacy_gateway: "Gateway (legacy)",
};

export function RefundMethodBadge({ method }: { method: RefundMethod }) {
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground border-border"
    >
      {METHOD_LABELS[method]}
    </Badge>
  );
}

export { STATUS_LABELS as REFUND_STATUS_LABELS, METHOD_LABELS as REFUND_METHOD_LABELS };

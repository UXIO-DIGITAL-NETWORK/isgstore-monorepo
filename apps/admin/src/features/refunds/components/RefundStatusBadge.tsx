import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RefundMethod, RefundStatus } from "../types/refund.type";

const STATUS_LABELS: Record<RefundStatus, string> = {
  // Each label says what the queue is blocked on, not what the enum is called.
  // WAITING_ACCOUNT is blocked on the customer, not on us.
  WAITING_ACCOUNT: "Awaiting account",
  WAITING_DETAILS: "Awaiting details",
  PENDING: "Ready to verify",
  PROCESSING: "In progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

// Monochrome by rule — color only via text-success/text-warning/text-destructive,
// everything else stays neutral (design_system.md §3). Border matches text so
// the pill reads as one color rather than a tinted label in a gray outline.
const STATUS_BADGE_CLASS: Record<RefundStatus, string> = {
  // Owed, but nothing an operator can do until the customer acts.
  WAITING_ACCOUNT: "text-muted-foreground border-border",
  WAITING_DETAILS: "text-muted-foreground border-border",
  // The only state that needs an operator to act, so it is the only one that
  // earns a color in the list.
  PENDING: "text-warning border-warning",
  PROCESSING: "text-warning border-warning",
  COMPLETED: "text-success border-success",
  REJECTED: "text-destructive border-destructive",
};

/**
 * Falls back to the raw enum value rather than rendering an empty pill.
 * This page ships ahead of the API that introduces new statuses, so an unknown
 * value is expected during a deploy — showing it is far better than a row that
 * silently looks stateless.
 */
export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_BADGE_CLASS[status] ?? "text-muted-foreground border-border")}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

const METHOD_LABELS: Record<RefundMethod, string> = {
  balance: "To balance",
  // The distinction that matters to an operator: this one is also going to
  // balance, but only after they have verified the account claiming it.
  balance_claim: "To balance (claimed)",
  manual_transfer: "Manual transfer",
  legacy_gateway: "Gateway (legacy)",
};

export function RefundMethodBadge({ method }: { method: RefundMethod }) {
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground border-border"
    >
      {METHOD_LABELS[method] ?? method}
    </Badge>
  );
}

export { STATUS_LABELS as REFUND_STATUS_LABELS, METHOD_LABELS as REFUND_METHOD_LABELS };

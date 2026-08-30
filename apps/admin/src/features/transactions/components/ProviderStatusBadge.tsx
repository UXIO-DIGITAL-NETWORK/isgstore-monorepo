import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProviderStatus } from "../types/transaction.type";

/**
 * The Topup Provider verdict — did the supplier actually deliver?
 *
 * Three labels here describe states the old single status column could not:
 * "Rejected" (the supplier said no) versus "No Response" (our retries ran out
 * without a verdict, which is worth retrying by hand), and "Unconfirmed" (the
 * supplier has the order but we hold no id for it, so nothing can poll it).
 */
const LABELS: Record<ProviderStatus, string> = {
  not_ordered: "Not Ordered",
  queued: "Queued",
  sending: "Sending",
  ordered: "In Progress",
  unconfirmed: "Unconfirmed",
  delivered: "Delivered",
  rejected: "Rejected",
  undelivered: "No Response",
};

// Monochrome by rule. `unconfirmed` is the one state given its own accent: it
// means we genuinely do not know and cannot find out by polling, which is
// neither "working" nor "failed" and is the row an operator must chase by hand.
const CLASS: Record<ProviderStatus, string> = {
  not_ordered: "text-muted-foreground border-border",
  queued: "text-warning border-warning",
  sending: "text-warning border-warning",
  ordered: "text-warning border-warning",
  unconfirmed: "text-chart-1 border-chart-1",
  delivered: "text-success border-success",
  rejected: "text-destructive border-destructive",
  undelivered: "text-destructive border-destructive",
};

interface ProviderStatusBadgeProps {
  status: ProviderStatus;
}

export function ProviderStatusBadge({ status }: ProviderStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(CLASS[status])}
    >
      {LABELS[status]}
    </Badge>
  );
}

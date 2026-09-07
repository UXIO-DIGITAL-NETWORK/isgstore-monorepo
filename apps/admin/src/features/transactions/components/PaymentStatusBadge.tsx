import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "../types/transaction.type";

/**
 * The Payment Gateway verdict — did the customer's money arrive?
 *
 * Separate from StatusBadge because it answers a different question over a
 * narrower vocabulary. Sharing one badge and one union is what let the old
 * Payment Status dropdown offer "Processing" and "Partial Success", neither of
 * which a payment can ever be.
 */
const LABELS: Record<PaymentStatus, string> = {
  pending: "Unpaid",
  success: "Paid",
  expired: "Expired",
  refunded: "Refunded",
  none: "No Gateway",
};

// Monochrome by rule — color only via text-success/text-destructive, everything
// else neutral (design_system.md §3). Border matches the text color so the pill
// reads as one color rather than a tinted label in a gray outline.
const CLASS: Record<PaymentStatus, string> = {
  pending: "text-muted-foreground border-border",
  success: "text-success border-success",
  expired: "text-destructive border-destructive",
  refunded: "text-muted-foreground border-border",
  // Not a failure: an admin-created or manually recorded order never went
  // through a gateway at all.
  none: "text-muted-foreground border-dashed border-border",
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(CLASS[status])}
    >
      {LABELS[status]}
    </Badge>
  );
}

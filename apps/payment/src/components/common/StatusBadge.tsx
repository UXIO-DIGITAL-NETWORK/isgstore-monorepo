import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";

/** Maps a domain status to a token-based badge tone. */
const TONE: Record<string, string> = {
  SETTLED: "bg-success/10 text-success",
  COMPLETED: "bg-success/10 text-success",
  PAID: "bg-success/10 text-success",
  ACTIVE: "bg-success/10 text-success",
  RESOLVED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-warning/10 text-warning",
  PROCESSING: "bg-warning/10 text-warning",
  UNPAID: "bg-warning/10 text-warning",
  WAITING_CONFIRMATION: "bg-warning/10 text-warning",
  INVESTIGATING: "bg-warning/10 text-warning",
  IDENTIFIED: "bg-warning/10 text-warning",
  MONITORING: "bg-warning/10 text-warning",
  MAJOR: "bg-warning/10 text-warning",
  REJECTED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
  FAILED_PROVIDER: "bg-destructive/10 text-destructive",
  CRITICAL: "bg-destructive/10 text-destructive",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
  MINOR: "bg-muted text-muted-foreground",
  // Reachable through the unified transaction feed.
  REFUNDED: "bg-muted text-muted-foreground",
  // The split transaction lifecycles. SUCCESS/DELIVERED read as done, the
  // in-flight provider states as warning, and NONE (no provider on a service
  // bill, or nothing to say) stays neutral rather than looking like a failure.
  SUCCESS: "bg-success/10 text-success",
  DELIVERED: "bg-success/10 text-success",
  QUEUED: "bg-warning/10 text-warning",
  SENDING: "bg-warning/10 text-warning",
  ORDERED: "bg-warning/10 text-warning",
  UNCONFIRMED: "bg-warning/10 text-warning",
  NOT_ORDERED: "bg-muted text-muted-foreground",
  UNDELIVERED: "bg-destructive/10 text-destructive",
  NONE: "bg-muted text-muted-foreground",
};

/**
 * `label` is optional and defaults to the raw status, so the ~15 pages that pass
 * only `status` are unaffected. It exists for the two transaction-status badges,
 * which own real dictionaries — a merchant should never read "FAILED_PROVIDER".
 */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Box
      as="span"
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        TONE[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label ?? status}
    </Box>
  );
}

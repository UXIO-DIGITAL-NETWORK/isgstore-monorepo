import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";

/** Maps a domain status to a token-based badge tone. */
const TONE: Record<string, string> = {
  SETTLED: "bg-success/10 text-success",
  COMPLETED: "bg-success/10 text-success",
  PAID: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-warning/10 text-warning",
  PROCESSING: "bg-warning/10 text-warning",
  REJECTED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
  FAILED_PROVIDER: "bg-destructive/10 text-destructive",
  EXPIRED: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Box
      as="span"
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        TONE[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </Box>
  );
}

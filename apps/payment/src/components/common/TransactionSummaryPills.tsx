import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

export interface SummaryCounts {
  count_success: number;
  count_pending: number;
  count_failed: number;
}

interface PillConfig {
  key: "success" | "pending" | "failed";
  label: string;
  countKey: keyof SummaryCounts;
  tone: string;
  border: string;
  bg: string;
  ring: string;
}

const PILLS: PillConfig[] = [
  { key: "success", label: "Sukses", countKey: "count_success", tone: "text-success", border: "border-success/30", bg: "bg-success/5", ring: "ring-success/40" },
  { key: "pending", label: "Pending", countKey: "count_pending", tone: "text-warning", border: "border-warning/30", bg: "bg-warning/5", ring: "ring-warning/40" },
  { key: "failed", label: "Gagal", countKey: "count_failed", tone: "text-destructive", border: "border-destructive/30", bg: "bg-destructive/5", ring: "ring-destructive/40" },
];

interface Props {
  counts?: SummaryCounts;
  /** "" | "success" | "pending" | "failed" — the bucket currently filtering the table. */
  active: string;
  onToggle: (group: string) => void;
  isLoading?: boolean;
}

/**
 * Three clickable status cards above the table. Clicking one filters the list
 * to that bucket (and clicking the active one clears it); the counts stay put
 * because the summary endpoint ignores the status filter on purpose.
 */
export function TransactionSummaryPills({ counts, active, onToggle, isLoading }: Props) {
  return (
    <Box className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PILLS.map((pill) => {
        const isActive = active === pill.key;
        return (
          <Box
            key={pill.key}
            as="button"
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(isActive ? "" : pill.key)}
            className={cn(
              "flex items-center justify-between rounded-2xl border p-4 text-left transition-colors",
              pill.border,
              pill.bg,
              isActive ? cn("ring-2", pill.ring) : "hover:bg-muted/50",
            )}
          >
            <Text as="span" variant="small" className="font-medium text-muted-foreground">
              {pill.label}
            </Text>
            <Text as="span" className={cn("text-2xl font-semibold tabular-nums", pill.tone)}>
              {isLoading || !counts ? "–" : counts[pill.countKey].toLocaleString("id-ID")}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

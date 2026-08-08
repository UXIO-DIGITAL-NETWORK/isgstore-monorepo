import { Download } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import { useExportTransactions } from "../hooks/useTransactions";
import type { TransactionListParams } from "../types/transaction.type";

interface ExportButtonProps {
  /** The current filter set — the export respects it, minus pagination. */
  params: TransactionListParams;
}

/**
 * Downloads the filtered transaction set as CSV (product_requirements.md §4.3).
 * Gated by `transactions.export`; Excel is a follow-up once the endpoint offers it.
 */
export function ExportButton({ params }: ExportButtonProps) {
  const exportTransactions = useExportTransactions();

  return (
    <Can permission="transactions.export">
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        disabled={exportTransactions.isPending}
        onClick={() => exportTransactions.mutate(params)}
      >
        <Download />
        {exportTransactions.isPending ? "Exporting..." : "Export"}
      </Button>
    </Can>
  );
}

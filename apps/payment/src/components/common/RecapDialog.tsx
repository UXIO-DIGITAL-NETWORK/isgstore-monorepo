import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import type { FinanceTransactionSummary, TransactionSummary } from "@/types/transaction.type";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Box className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <Text as="span" variant="small" className="text-muted-foreground">
        {label}
      </Text>
      <Text as="span" className={cn("font-medium tabular-nums", tone)}>
        {value}
      </Text>
    </Box>
  );
}

interface Props {
  summary?: TransactionSummary | FinanceTransactionSummary;
  isInternal?: boolean;
  isLoading?: boolean;
}

/** "Recap" button + dialog: the totals behind the currently-filtered table. */
export function RecapDialog({ summary, isInternal, isLoading }: Props) {
  const finance = isInternal ? (summary as FinanceTransactionSummary | undefined) : undefined;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Recap
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ringkasan Transaksi</DialogTitle>
          <DialogDescription>Total untuk filter yang sedang aktif.</DialogDescription>
        </DialogHeader>

        {isLoading || !summary ? (
          <Text as="span" variant="small" className="text-muted-foreground">
            Memuat ringkasan…
          </Text>
        ) : (
          <Box className="flex flex-col">
            <Row label="Jumlah Transaksi" value={summary.count_total.toLocaleString("id-ID")} />
            <Row label="Sukses" value={summary.count_success.toLocaleString("id-ID")} tone="text-success" />
            <Row label="Pending" value={summary.count_pending.toLocaleString("id-ID")} tone="text-warning" />
            <Row label="Gagal" value={summary.count_failed.toLocaleString("id-ID")} tone="text-destructive" />
            <Row label="Total Nominal" value={money(summary.amount_total)} />

            {finance ? (
              <>
                <Row label="Total (Gross)" value={money(finance.gross_total)} />
                <Row label="Biaya Admin" value={money(finance.admin_fee_total)} />
                <Row label="Fee Gateway" value={money(finance.gateway_fee_total)} />
                <Row label="Profit Kita" value={money(finance.platform_profit_total)} tone="text-success" />
              </>
            ) : null}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

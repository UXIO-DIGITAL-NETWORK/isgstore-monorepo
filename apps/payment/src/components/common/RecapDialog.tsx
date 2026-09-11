import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
          <DialogTitle>{t("recap.title")}</DialogTitle>
          <DialogDescription>{t("recap.description")}</DialogDescription>
        </DialogHeader>

        {isLoading || !summary ? (
          <Text as="span" variant="small" className="text-muted-foreground">
            Memuat ringkasan…
          </Text>
        ) : (
          <Box className="flex flex-col">
            <Row label={t("recap.countTotal")} value={summary.count_total.toLocaleString("id-ID")} />
            <Row label={t("recap.countSuccess")} value={summary.count_success.toLocaleString("id-ID")} tone="text-success" />
            <Row label={t("recap.countPending")} value={summary.count_pending.toLocaleString("id-ID")} tone="text-warning" />
            <Row label={t("recap.countFailed")} value={summary.count_failed.toLocaleString("id-ID")} tone="text-destructive" />
            <Row label={t("recap.amountTotal")} value={money(summary.amount_total)} />

            {finance ? (
              <>
                <Row label={t("recap.gross")} value={money(finance.gross_total)} />
                <Row label={t("recap.adminFee")} value={money(finance.admin_fee_total)} />
                <Row label={t("recap.gatewayFee")} value={money(finance.gateway_fee_total)} />
                <Row label={t("recap.profit")} value={money(finance.platform_profit_total)} tone="text-success" />
              </>
            ) : null}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

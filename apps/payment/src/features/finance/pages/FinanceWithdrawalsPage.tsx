import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { Withdrawal } from "@/types/withdrawal.type";
import { ApproveWithdrawalDialog } from "../components/ApproveWithdrawalDialog";
import { useFinanceWithdrawals, useRejectWithdrawal } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

export default function FinanceWithdrawalsPage() {
  const { t } = useTranslation("finance");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFinanceWithdrawals({ page, per_page: 20 });
  const { mutate: reject, isPending: rejecting } = useRejectWithdrawal();

  const columns: Column<Withdrawal>[] = [
    { key: "number", header: t("withdrawals.colNumber"), cell: (r) => <Text as="span" className="font-medium">{r.withdrawal_number}</Text> },
    { key: "merchant", header: t("withdrawals.colMerchant"), cell: (r) => r.merchant?.name ?? "-" },
    { key: "amount", header: t("withdrawals.colAmount"), className: "text-right tabular-nums", cell: (r) => money(r.amount) },
    { key: "nett", header: t("withdrawals.colNett"), className: "text-right tabular-nums", cell: (r) => money(r.nett) },
    { key: "bank", header: t("withdrawals.colAccount"), cell: (r) => `${r.bank_code} · ${r.account_number}` },
    { key: "status", header: t("withdrawals.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
    { key: "created", header: t("withdrawals.colDate"), cell: (r) => formatDateTime(r.created_at) },
    {
      key: "actions",
      header: t("withdrawals.colAction"),
      cell: (r) => {
        if (r.status === "PENDING") {
          return (
            <Box className="flex gap-2">
              <ApproveWithdrawalDialog withdrawal={r} />
              <Button
                size="sm"
                variant="outline"
                disabled={rejecting}
                onClick={() => reject({ id: r.id, reason: t("withdrawals.rejectReason") })}
              >
                {t("withdrawals.reject")}
              </Button>
            </Box>
          );
        }
        if (r.status === "PROCESSING") {
          return (
            <Text as="span" variant="small" className="text-muted-foreground">
              {t("withdrawals.processing")}
            </Text>
          );
        }
        if (r.status === "FAILED") {
          return (
            <Text as="span" variant="small" className="text-destructive">
              {r.failure_reason ?? t("withdrawals.payoutFailed")}
            </Text>
          );
        }
        // SETTLED — show the Monetapay disbursement reference; fall back to the
        // legacy manual proof link for rows settled before the switch.
        if (r.disbursement_ref) {
          return (
            <Text as="span" variant="small" className="tabular-nums text-muted-foreground">
              {r.disbursement_ref}
            </Text>
          );
        }
        if (r.proof_url) {
          return (
            <Link href={r.proof_url} target="_blank" rel="noreferrer">
              <Text as="span" variant="small" className="underline">
                {t("withdrawals.viewProof")}
              </Text>
            </Link>
          );
        }
        return (
          <Text as="span" variant="small">
            —
          </Text>
        );
      },
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("withdrawals.title")}</Heading>
      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("withdrawals.empty")}
        rowKey={(r) => r.id}
      />
      <Pager page={data?.page ?? page} lastPage={data?.lastPage ?? 1} total={data?.total ?? 0} onPageChange={setPage} />
    </Box>
  );
}

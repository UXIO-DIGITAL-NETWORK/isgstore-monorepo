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
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFinanceWithdrawals({ page, per_page: 20 });
  const { mutate: reject, isPending: rejecting } = useRejectWithdrawal();

  const columns: Column<Withdrawal>[] = [
    { key: "number", header: "No. Penarikan", cell: (r) => <Text as="span" className="font-medium">{r.withdrawal_number}</Text> },
    { key: "merchant", header: "Merchant", cell: (r) => r.merchant?.name ?? "-" },
    { key: "amount", header: "Nominal", className: "text-right tabular-nums", cell: (r) => money(r.amount) },
    { key: "nett", header: "Diterima", className: "text-right tabular-nums", cell: (r) => money(r.nett) },
    { key: "bank", header: "Rekening", cell: (r) => `${r.bank_code} · ${r.account_number}` },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
    {
      key: "actions",
      header: "Aksi",
      cell: (r) => {
        if (r.status === "PENDING") {
          return (
            <Box className="flex gap-2">
              <ApproveWithdrawalDialog withdrawal={r} />
              <Button
                size="sm"
                variant="outline"
                disabled={rejecting}
                onClick={() => reject({ id: r.id, reason: "Ditolak oleh admin" })}
              >
                Tolak
              </Button>
            </Box>
          );
        }
        if (r.status === "PROCESSING") {
          return (
            <Text as="span" variant="small" className="text-muted-foreground">
              Memproses…
            </Text>
          );
        }
        if (r.status === "FAILED") {
          return (
            <Text as="span" variant="small" className="text-destructive">
              {r.failure_reason ?? "Pencairan gagal"}
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
                Lihat Bukti
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
      <Heading level={1}>Penarikan</Heading>
      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada permintaan penarikan"
        rowKey={(r) => r.id}
      />
      <Pager page={data?.page ?? page} lastPage={data?.lastPage ?? 1} total={data?.total ?? 0} onPageChange={setPage} />
    </Box>
  );
}

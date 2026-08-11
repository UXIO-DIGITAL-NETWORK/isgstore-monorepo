import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";

import { useCreateWithdrawal, useMerchantWithdrawals } from "../hooks/useMerchant";
import { withdrawalSchema, type WithdrawalFormValues } from "../schemas/withdrawal.schema";
import type { Withdrawal } from "../types/merchant.type";

const columns: Column<Withdrawal>[] = [
  { key: "number", header: "No. Penarikan", cell: (r) => <Text as="span" className="font-medium">{r.withdrawal_number}</Text> },
  { key: "amount", header: "Nominal", className: "text-right tabular-nums", cell: (r) => formatCurrency(r.amount, { fractionDigits: 0 }) },
  { key: "fee", header: "Biaya", className: "text-right tabular-nums", cell: (r) => formatCurrency(r.fee, { fractionDigits: 0 }) },
  { key: "nett", header: "Diterima", className: "text-right tabular-nums", cell: (r) => formatCurrency(r.nett, { fractionDigits: 0 }) },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
];

export default function MerchantWithdrawalsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMerchantWithdrawals({ page, per_page: 20 });
  const { mutate: create, isPending } = useCreateWithdrawal();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({ resolver: zodResolver(withdrawalSchema) });

  const onSubmit = (values: WithdrawalFormValues) => create(values, { onSuccess: () => reset() });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Penarikan</Heading>

      {/* Request form */}
      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Nominal</Label>
          <Input id="amount" type="number" {...register("amount", { valueAsNumber: true })} placeholder="100000" />
          {errors.amount && <Text variant="small" className="text-destructive">{errors.amount.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="bank_code">Bank</Label>
          <Input id="bank_code" {...register("bank_code")} placeholder="BCA" />
          {errors.bank_code && <Text variant="small" className="text-destructive">{errors.bank_code.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_number">No. Rekening</Label>
          <Input id="account_number" {...register("account_number")} placeholder="1234567890" />
          {errors.account_number && <Text variant="small" className="text-destructive">{errors.account_number.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_name">Nama Pemilik</Label>
          <Input id="account_name" {...register("account_name")} placeholder="Nama sesuai rekening" />
          {errors.account_name && <Text variant="small" className="text-destructive">{errors.account_name.message}</Text>}
        </Box>
        <Box className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Memproses…" : "Ajukan Penarikan"}
          </Button>
        </Box>
      </Box>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada penarikan"
        rowKey={(r) => r.id}
      />
      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </Box>
  );
}

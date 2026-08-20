import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";

import { BankCombobox } from "../components/BankCombobox";
import { isEwalletCode } from "../constants/bankCodes";
import { withdrawalFeeFor, withdrawalNettFor } from "../lib/withdrawalFee";
import { useCreateWithdrawal, useMerchantDashboard, useMerchantWithdrawals } from "../hooks/useMerchant";
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
  const { data: dash } = useMerchantDashboard();
  const { mutate: create, isPending } = useCreateWithdrawal();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({ resolver: zodResolver(withdrawalSchema) });

  const bankCode = watch("bank_code");
  const isEwallet = isEwalletCode(bankCode);

  // Live preview of kita's fee and what lands in the bank. Mirrors the server;
  // the charged figure is recomputed on submit.
  const amount = watch("amount");
  const previewAmount = Number.isFinite(amount) ? Number(amount) : 0;
  const previewFee = withdrawalFeeFor(previewAmount);
  const previewNett = withdrawalNettFor(previewAmount);

  const onSubmit = (values: WithdrawalFormValues) => create(values, { onSuccess: () => reset() });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Penarikan</Heading>

      <StatCard
        data={{
          id: "saldo",
          label: "Saldo yang bisa ditarik",
          value: dash?.saldo_aktif ?? 0,
          caption: "Nominal maksimal yang dapat kamu tarik saat ini",
        }}
      />

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
          <Label htmlFor="bank_code">Bank / E-wallet</Label>
          {/* Registered hidden field so the value is validated + submitted; the
              combobox drives it via setValue. */}
          <input type="hidden" {...register("bank_code")} />
          <BankCombobox
            id="bank_code"
            value={bankCode}
            invalid={!!errors.bank_code}
            onChange={(code) => setValue("bank_code", code, { shouldValidate: true })}
          />
          {errors.bank_code && <Text variant="small" className="text-destructive">{errors.bank_code.message}</Text>}
        </Box>
        {!isEwallet && (
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="account_number">No. Rekening</Label>
            <Input id="account_number" {...register("account_number")} placeholder="1234567890" />
            {errors.account_number && <Text variant="small" className="text-destructive">{errors.account_number.message}</Text>}
          </Box>
        )}
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_name">Nama Pemilik</Label>
          <Input id="account_name" {...register("account_name")} placeholder="Nama sesuai rekening" />
          {errors.account_name && <Text variant="small" className="text-destructive">{errors.account_name.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_phone">No. HP Penerima</Label>
          <Input id="account_phone" {...register("account_phone")} placeholder="08123456789" />
          {errors.account_phone && <Text variant="small" className="text-destructive">{errors.account_phone.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
          {previewAmount > 0 && (
            <Box className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-muted/50 px-4 py-3 text-sm tabular-nums">
              <Text as="span" className="text-muted-foreground">
                Biaya: <Text as="span" className="text-foreground">{formatCurrency(previewFee, { fractionDigits: 0 })}</Text>
              </Text>
              <Text as="span" className="text-muted-foreground">
                Diterima: <Text as="span" className="font-medium text-foreground">{formatCurrency(previewNett, { fractionDigits: 0 })}</Text>
              </Text>
            </Box>
          )}
          <Button type="submit" disabled={isPending} className="w-fit">
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

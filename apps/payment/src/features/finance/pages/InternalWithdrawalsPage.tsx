import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { BankCombobox } from "@/components/common/BankCombobox";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isEwalletCode, usePayoutBanks } from "@/hooks/usePayoutBanks";
import { withdrawalFeeFor, withdrawalNettFor } from "@/lib/withdrawalFee";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { Withdrawal } from "@/types/withdrawal.type";

import { ApproveWithdrawalDialog } from "../components/ApproveWithdrawalDialog";
import {
  useCreateInternalWithdrawal,
  useFinanceWithdrawals,
  usePlatformBalance,
  useRejectWithdrawal,
} from "../hooks/useFinance";
import { internalWithdrawalSchema, type InternalWithdrawalFormValues } from "../schemas/internalWithdrawal.schema";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

export default function InternalWithdrawalsPage() {
  const { t } = useTranslation("finance");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFinanceWithdrawals({ page, per_page: 20, type: "internal" });
  const { data: balance } = usePlatformBalance();
  const { mutate: create, isPending } = useCreateInternalWithdrawal();
  const { mutate: reject, isPending: rejecting } = useRejectWithdrawal();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InternalWithdrawalFormValues>({
    resolver: zodResolver(internalWithdrawalSchema),
    defaultValues: { is_ewallet: false },
  });

  const { data: banks = [] } = usePayoutBanks();
  const bankCode = watch("bank_code");
  const isEwallet = isEwalletCode(banks, bankCode);

  // Form state only, so the schema can branch on the rail; stripped on submit.
  useEffect(() => setValue("is_ewallet", isEwallet), [isEwallet, setValue]);

  const amount = watch("amount");
  const previewAmount = Number.isFinite(amount) ? Number(amount) : 0;
  const previewFee = withdrawalFeeFor(previewAmount);
  const previewNett = withdrawalNettFor(previewAmount);

  // Built field by field: `is_ewallet` drives the schema's branch and is not
  // something the API accepts.
  const onSubmit = (values: InternalWithdrawalFormValues) =>
    create(
      {
        amount: values.amount,
        bank_code: values.bank_code,
        account_number: values.account_number,
        account_name: values.account_name,
        account_phone: values.account_phone,
        notes: values.notes,
      },
      { onSuccess: () => reset() },
    );

  const columns: Column<Withdrawal>[] = [
    { key: "number", header: t("internalWithdrawals.colNumber"), cell: (r) => <Text as="span" className="font-medium">{r.withdrawal_number}</Text> },
    { key: "requester", header: t("internalWithdrawals.colRequester"), cell: (r) => r.requester?.name ?? "-" },
    { key: "amount", header: t("internalWithdrawals.colAmount"), className: "text-right tabular-nums", cell: (r) => money(r.amount) },
    { key: "nett", header: t("internalWithdrawals.colNett"), className: "text-right tabular-nums", cell: (r) => money(r.nett) },
    { key: "bank", header: t("internalWithdrawals.colAccount"), cell: (r) => `${r.bank_code} · ${r.account_number}` },
    { key: "status", header: t("internalWithdrawals.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
    { key: "created", header: t("internalWithdrawals.colDate"), cell: (r) => formatDateTime(r.created_at) },
    {
      key: "actions",
      header: t("internalWithdrawals.colAction"),
      cell: (r) => {
        if (r.status === "PENDING") {
          return (
            <Box className="flex gap-2">
              <ApproveWithdrawalDialog withdrawal={r} allowManual />
              <Button
                size="sm"
                variant="outline"
                disabled={rejecting}
                onClick={() => reject({ id: r.id, reason: "Dibatalkan oleh internal" })}
              >
                Tolak
              </Button>
            </Box>
          );
        }
        if (r.status === "PROCESSING") {
          return (
            <Text as="span" variant="small" className="text-muted-foreground">
              {t("internalWithdrawals.processing")}
            </Text>
          );
        }
        if (r.status === "FAILED") {
          return (
            <Text as="span" variant="small" className="text-destructive">
              {r.failure_reason ?? t("internalWithdrawals.payoutFailed")}
            </Text>
          );
        }
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
                {t("internalWithdrawals.viewProof")}
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
      <Heading level={1}>{t("internalWithdrawals.title")}</Heading>

      <StatCard
        data={{
          id: "saldo-platform",
          label: t("internalWithdrawals.platformBalance"),
          value: balance?.available ?? 0,
          caption: t("internalWithdrawals.platformBalanceCaption"),
        }}
      />

      {/* Request form — kita creates its own withdrawal, same fields as the merchant form, no merchant to pick. */}
      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="amount">{t("internalWithdrawals.amount")}</Label>
          <Input id="amount" type="number" {...register("amount", { valueAsNumber: true })} placeholder="100000" />
          {errors.amount && <Text variant="small" className="text-destructive">{errors.amount.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="bank_code">{t("internalWithdrawals.bankOrEwallet")}</Label>
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
            <Label htmlFor="account_number">{t("internalWithdrawals.accountNumber")}</Label>
            <Input id="account_number" {...register("account_number")} placeholder="1234567890" />
            {errors.account_number && <Text variant="small" className="text-destructive">{errors.account_number.message}</Text>}
          </Box>
        )}
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_name">{t("internalWithdrawals.accountName")}</Label>
          <Input id="account_name" {...register("account_name")} placeholder={t("internalWithdrawals.accountNamePlaceholder")} />
          {errors.account_name && <Text variant="small" className="text-destructive">{errors.account_name.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_phone">{t("internalWithdrawals.accountPhone")}</Label>
          <Input id="account_phone" {...register("account_phone")} placeholder="08123456789" />
          {errors.account_phone && <Text variant="small" className="text-destructive">{errors.account_phone.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
          {previewAmount > 0 && (
            <Box className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-muted/50 px-4 py-3 text-sm tabular-nums">
              <Text as="span" className="text-muted-foreground">
                {t("internalWithdrawals.feeLabel")}: <Text as="span" className="text-foreground">{formatCurrency(previewFee, { fractionDigits: 0 })}</Text>
              </Text>
              <Text as="span" className="text-muted-foreground">
                {t("internalWithdrawals.receivedLabel")}: <Text as="span" className="font-medium text-foreground">{formatCurrency(previewNett, { fractionDigits: 0 })}</Text>
              </Text>
            </Box>
          )}
          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? t("internalWithdrawals.submitting") : t("internalWithdrawals.submit")}
          </Button>
        </Box>
      </Box>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("internalWithdrawals.empty")}
        rowKey={(r) => r.id}
      />
      <Pager page={data?.page ?? page} lastPage={data?.lastPage ?? 1} total={data?.total ?? 0} onPageChange={setPage} />
    </Box>
  );
}

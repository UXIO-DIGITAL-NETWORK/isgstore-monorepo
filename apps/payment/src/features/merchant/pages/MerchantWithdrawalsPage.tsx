import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { BankCombobox } from "@/components/common/BankCombobox";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isEwalletCode, usePayoutBanks } from "@/hooks/usePayoutBanks";
import { withdrawalFeeFor, withdrawalNettFor } from "@/lib/withdrawalFee";
import { withdrawalStatusLabelKey } from "@/lib/withdrawalStatus";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";

import { useCreateWithdrawal, useMerchantDashboard, useMerchantWithdrawals } from "../hooks/useMerchant";
import { withdrawalSchema, type WithdrawalFormValues } from "../schemas/withdrawal.schema";
import type { Withdrawal } from "../types/merchant.type";

/**
 * A factory rather than a module constant: column headers are rendered text, so
 * they have to be resolved when the component renders, not frozen at import.
 */
const columnsFor = (t: TFunction<"merchant">): Column<Withdrawal>[] => [
  {
    key: "number",
    header: t("withdrawals.colNumber"),
    // The row is the way in to the one page that can say WHERE the money is
    // being sent and why it failed.
    cell: (r) => (
      <Link href={`/app/payment-admin/withdrawals/${r.withdrawal_number}`} className="font-medium underline">
        {r.withdrawal_number}
      </Link>
    ),
  },
  { key: "amount", header: t("withdrawals.colAmount"), className: "text-right tabular-nums", cell: (r) => formatCurrency(r.amount, { fractionDigits: 0 }) },
  { key: "fee", header: t("withdrawals.colFee"), className: "text-right tabular-nums", cell: (r) => formatCurrency(r.fee, { fractionDigits: 0 }) },
  { key: "nett", header: t("withdrawals.colNett"), className: "text-right tabular-nums", cell: (r) => formatCurrency(r.nett, { fractionDigits: 0 }) },
  {
    key: "status",
    header: t("withdrawals.colStatus"),
    // Wording, not the enum — see lib/withdrawalStatus.
    cell: (r) => (
      <StatusBadge
        status={r.status}
        label={withdrawalStatusLabelKey(r.status) ? t(withdrawalStatusLabelKey(r.status) as string) : undefined}
      />
    ),
  },
  { key: "created", header: t("withdrawals.colDate"), cell: (r) => formatDateTime(r.created_at) },
];

export default function MerchantWithdrawalsPage() {
  const { t } = useTranslation("merchant");
  const columns = columnsFor(t);
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
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { is_ewallet: false },
  });

  // Which rail the picked code takes is the server catalogue's answer, not a
  // list bundled here — see usePayoutBanks.
  const { data: banks = [] } = usePayoutBanks();
  const bankCode = watch("bank_code");
  const isEwallet = isEwalletCode(banks, bankCode);

  // Mirrored into form state so the schema's refine() can require the account
  // number (bank) or the phone (e-wallet) without knowing the catalogue.
  useEffect(() => setValue("is_ewallet", isEwallet), [isEwallet, setValue]);

  // Live preview of kita's fee and what lands in the bank. Mirrors the server;
  // the charged figure is recomputed on submit.
  const amount = watch("amount");
  const previewAmount = Number.isFinite(amount) ? Number(amount) : 0;
  const previewFee = withdrawalFeeFor(previewAmount);
  const previewNett = withdrawalNettFor(previewAmount);

  // `is_ewallet` is form state for the schema's branch, not a request field —
  // the payload is built by hand so it cannot ride along.
  const onSubmit = (values: WithdrawalFormValues) =>
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

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("withdrawals.title")}</Heading>

      <StatCard
        data={{
          id: "saldo",
          label: t("withdrawals.available"),
          value: dash?.saldo_aktif ?? 0,
          caption: t("withdrawals.availableCaption"),
        }}
      />

      {/* Request form */}
      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="amount">{t("withdrawals.amount")}</Label>
          <Input id="amount" type="number" {...register("amount", { valueAsNumber: true })} placeholder="100000" />
          {errors.amount && <Text variant="small" className="text-destructive">{errors.amount.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="bank_code">{t("withdrawals.bankOrEwallet")}</Label>
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
            <Label htmlFor="account_number">{t("withdrawals.accountNumber")}</Label>
            <Input id="account_number" {...register("account_number")} placeholder="1234567890" />
            {errors.account_number && <Text variant="small" className="text-destructive">{errors.account_number.message}</Text>}
          </Box>
        )}
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_name">{t("withdrawals.accountName")}</Label>
          <Input id="account_name" {...register("account_name")} placeholder={t("withdrawals.accountNamePlaceholder")} />
          {errors.account_name && <Text variant="small" className="text-destructive">{errors.account_name.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="account_phone">{t("withdrawals.accountPhone")}</Label>
          <Input id="account_phone" {...register("account_phone")} placeholder="08123456789" />
          {errors.account_phone && <Text variant="small" className="text-destructive">{errors.account_phone.message}</Text>}
        </Box>
        <Box className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
          {previewAmount > 0 && (
            <Box className="flex flex-col gap-1 rounded-lg bg-muted/50 px-4 py-3 text-sm tabular-nums">
              <Box className="flex flex-wrap gap-x-6 gap-y-1">
                <Text as="span" className="text-muted-foreground">
                  {t("withdrawals.feeLabel")}: <Text as="span" className="text-foreground">{formatCurrency(previewFee, { fractionDigits: 0 })}</Text>
                </Text>
                <Text as="span" className="text-muted-foreground">
                  {t("withdrawals.receivedLabel")}: <Text as="span" className="font-medium text-foreground">{formatCurrency(previewNett, { fractionDigits: 0 })}</Text>
                </Text>
              </Box>
              {/* Without this the arithmetic reads as a percentage: 1.665 on
                  100.000 looks like a rate, and a client would expect the fee to
                  grow with the amount. */}
              <Text as="span" variant="small">
                {t("withdrawals.feeNote")}
              </Text>
            </Box>
          )}
          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? t("withdrawals.submitting") : t("withdrawals.submit")}
          </Button>
        </Box>
      </Box>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("withdrawals.empty")}
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

import React, { useEffect, useMemo, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { payoutDetailsSchema, type PayoutDetailsFormValues } from "@/features/refund/schemas/refund.schema";
import { usePayoutBanks } from "@/features/refund/hooks/useRefundClaim";
import type { PayoutDetailsPayload } from "@/features/refund/types/refund.type";

interface Props {
  onSubmit: (payload: PayoutDetailsPayload) => void;
  isPending: boolean;
}

/**
 * Where the money goes. The destination list is fetched from the API rather
 * than bundled, so the customer can never pick a code the API will reject.
 *
 * An e-wallet is paid out on a phone number and a bank on an account number,
 * which is why the second field swaps instead of both being shown — asking for
 * both would guarantee one is filled in wrong.
 */
export default function PayoutDetailsForm({ onSubmit, isPending }: Props): React.JSX.Element {
  const { t } = useTranslation("refund");
  const { data: banks = [] } = usePayoutBanks();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PayoutDetailsFormValues>({
    resolver: zodResolver(payoutDetailsSchema),
    defaultValues: { bank_code: "", account_number: "", account_name: "", account_phone: "", is_ewallet: false },
  });

  const bankCode = watch("bank_code");
  const isEwallet = useMemo(() => banks.find((bank) => bank.code === bankCode)?.is_ewallet ?? false, [banks, bankCode]);

  // Held in form state so the schema's refine() can branch on it without the
  // resolver needing to know about the bank catalogue.
  useEffect(() => setValue("is_ewallet", isEwallet), [isEwallet, setValue]);

  const submit = handleSubmit((values) =>
    onSubmit({
      bank_code: values.bank_code,
      account_name: values.account_name.trim(),
      ...(values.account_number?.trim() ? { account_number: values.account_number.trim() } : {}),
      ...(values.account_phone?.trim() ? { account_phone: values.account_phone.trim() } : {}),
    }),
  );

  return (
    <Box className="rounded-2xl border border-[rgba(208,201,129,0.35)] bg-[rgb(14,20,10)] p-6 md:p-8">
      <Box
        as="form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-4"
      >
        <Box className="flex flex-col gap-1">
          <Text as="p" className="font-outfit font-semibold text-[15px] text-white">
            {t("form.heading")}
          </Text>
          <Text as="p" className="font-inter text-[12px] text-white/55 leading-relaxed">
            {t("form.subtitle")}
          </Text>
        </Box>

        <Box className="flex flex-col gap-2">
          <Box as="label" htmlFor="payout-bank" className="font-inter text-[13px] text-white/55">
            {t("form.bank")}
          </Box>
          <select
            id="payout-bank"
            {...register("bank_code")}
            className="w-full bg-[rgb(14,20,10)] border border-white/10 rounded-full px-4 py-2.5 text-white text-sm font-inter outline-none focus:border-[rgb(67,86,32)]/60 transition-all"
          >
            <option value="">{t("form.bankPlaceholder")}</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.code} — {bank.name}
              </option>
            ))}
          </select>
          {errors.bank_code && (
            <Text as="span" className="font-inter text-[12px] text-red-400">
              {t(errors.bank_code.message ?? "")}
            </Text>
          )}
        </Box>

        <Box className="flex flex-col gap-2">
          <Box
            as="label"
            htmlFor={isEwallet ? "payout-phone" : "payout-account"}
            className="font-inter text-[13px] text-white/55"
          >
            {isEwallet ? t("form.accountPhone") : t("form.accountNumber")}
          </Box>
          {isEwallet ? (
            <Input id="payout-phone" {...register("account_phone")} type="tel" placeholder="08xxxxxxxxxx" />
          ) : (
            <Input id="payout-account" {...register("account_number")} type="text" placeholder="1234567890" />
          )}
          {errors.account_number && (
            <Text as="span" className="font-inter text-[12px] text-red-400">
              {t(isEwallet ? "form.errors.accountPhone" : "form.errors.accountNumber")}
            </Text>
          )}
        </Box>

        <Box className="flex flex-col gap-2">
          <Box as="label" htmlFor="payout-name" className="font-inter text-[13px] text-white/55">
            {t("form.accountName")}
          </Box>
          <Input
            id="payout-name"
            {...register("account_name")}
            type="text"
            placeholder={t("form.accountNamePlaceholder")}
          />
          {errors.account_name && (
            <Text as="span" className="font-inter text-[12px] text-red-400">
              {t(errors.account_name.message ?? "")}
            </Text>
          )}
        </Box>

        <Button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2 py-3">
          <Landmark className="w-4 h-4 shrink-0" />
          {isPending ? t("form.submitting") : t("form.submit")}
        </Button>
      </Box>
    </Box>
  );
}

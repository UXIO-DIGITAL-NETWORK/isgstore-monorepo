import React, { type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Info, Send } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { claimLookupSchema, type ClaimLookupFormValues } from "@/features/refund/schemas/refund.schema";
import { useResendClaimLink } from "@/features/refund/hooks/useRefundClaim";

interface Props {
  /** Pre-filled from `?invoice=` when the customer arrives from their invoice page. */
  defaultInvoiceNumber?: string;
}

/**
 * "I lost the refund email."
 *
 * The link is re-sent out of band rather than opening the payout form here,
 * and the confirmation is the same whether or not anything matched. That is
 * deliberate: anyone holding a leaked invoice number could otherwise probe
 * email addresses until one answered differently, and the prize would be the
 * ability to redirect someone else's refund.
 */
export default function RefundLookupCard({ defaultInvoiceNumber }: Props): React.JSX.Element {
  const { t } = useTranslation("refund");
  const resend = useResendClaimLink();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimLookupFormValues>({
    resolver: zodResolver(claimLookupSchema),
    defaultValues: { invoice_number: defaultInvoiceNumber ?? "", contact: "" },
  });

  const onSubmit = handleSubmit((values) =>
    resend.mutate({ invoiceNumber: values.invoice_number.trim(), contact: values.contact.trim() }),
  );

  return (
    <Box className="rounded-2xl border border-[rgba(147,51,234,0.35)] bg-[#0D1117] p-6 md:p-8">
      <Box
        as="form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void onSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <Text as="p" className="font-outfit font-semibold text-[15px] text-white">
          {t("lookup.label")}
        </Text>

        <Box className="flex flex-col gap-2">
          <Box as="label" htmlFor="refund-invoice" className="font-inter text-[13px] text-white/55">
            {t("lookup.invoice")}
          </Box>
          <Input
            id="refund-invoice"
            {...register("invoice_number")}
            type="text"
            placeholder={t("lookup.invoicePlaceholder")}
          />
          {errors.invoice_number && (
            <Text as="span" className="font-inter text-[12px] text-red-400">
              {t(errors.invoice_number.message ?? "")}
            </Text>
          )}
        </Box>

        <Box className="flex flex-col gap-2">
          <Box as="label" htmlFor="refund-contact" className="font-inter text-[13px] text-white/55">
            {t("lookup.contact")}
          </Box>
          <Input
            id="refund-contact"
            {...register("contact")}
            type="text"
            placeholder={t("lookup.contactPlaceholder")}
          />
          {errors.contact && (
            <Text as="span" className="font-inter text-[12px] text-red-400">
              {t(errors.contact.message ?? "")}
            </Text>
          )}
        </Box>

        <Button type="submit" disabled={resend.isPending} className="w-full flex items-center justify-center gap-2 py-3">
          <Send className="w-4 h-4 shrink-0" />
          {resend.isPending ? t("lookup.sending") : t("lookup.button")}
        </Button>

        {resend.isSuccess ? (
          <Box className="flex items-start gap-3 rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <Text as="span" className="font-inter text-[12px] text-white/70 leading-relaxed">
              {t("lookup.sent")}
            </Text>
          </Box>
        ) : (
          <Box className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <Info className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
            <Text as="span" className="font-inter text-[12px] text-white/55 leading-relaxed">
              {t("lookup.hint")}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

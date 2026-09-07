import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/lib/format";
import type { RefundClaimModel } from "@/features/refund/types/refund.type";

function Row({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <Box className="flex items-start gap-3">
      <Text as="span" className="font-inter text-[13px] text-white/55 w-[150px] shrink-0">
        {label}
      </Text>
      <Text as="span" className="font-plex text-[13px] text-white font-medium leading-none">
        {value}
      </Text>
    </Box>
  );
}

/**
 * What the customer is claiming. The contact fields arrive already masked from
 * the API — enough for them to recognise their own order, useless to anyone who
 * intercepted the link.
 */
export default function RefundSummaryCard({ claim }: { claim: RefundClaimModel }): React.JSX.Element {
  const { t, i18n } = useTranslation("refund");
  const done = claim.status === "COMPLETED";

  return (
    <Box className="rounded-2xl border border-[rgba(147,51,234,0.35)] bg-[#0D1117] p-6 md:p-8 flex flex-col gap-4">
      <Box className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
        )}
        <Text as="p" className="font-outfit font-semibold text-[15px] text-white">
          {t("claim.heading")}
        </Text>
      </Box>

      <Box className="flex flex-col gap-3">
        <Row label={t("claim.invoice")} value={claim.invoice_number ?? "—"} />
        {claim.product && <Row label={t("claim.product")} value={claim.product} />}
        <Row
          label={t("claim.amount")}
          value={
            <Text as="span" className="font-plex text-[18px] font-bold text-white leading-none">
              {formatCurrency(claim.amount, i18n.language)}
            </Text>
          }
        />
        <Row
          label={t("claim.status")}
          value={
            <Box
              className={`inline-block rounded-md border px-3 py-0.5 ${
                done ? "border-green-500/70 bg-green-500/10" : "border-amber-500/70 bg-amber-500/10"
              }`}
            >
              <Text
                as="span"
                className={`font-plex font-bold text-[11px] leading-none ${done ? "text-green-400" : "text-amber-400"}`}
              >
                {t(`status.${claim.status}`)}
              </Text>
            </Box>
          }
        />
        {claim.payout && (
          <Row
            label={t("form.bank")}
            value={`${claim.payout.bank_name ?? claim.payout.bank_code} · ${claim.payout.account_number ?? "—"}`}
          />
        )}
        {claim.contact.email && (
          <Text as="p" className="font-inter text-[12px] text-white/40">
            {t("claim.sentTo", { contact: claim.contact.email })}
          </Text>
        )}
      </Box>
    </Box>
  );
}

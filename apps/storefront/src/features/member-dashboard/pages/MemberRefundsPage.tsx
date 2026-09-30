import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Clock, Wallet } from "lucide-react";

import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { memberRefundService } from "@/features/member-dashboard/services/refund.service";

/**
 * "Where is my refund?", for the account that claimed it.
 *
 * The failed order itself is deliberately absent from the transaction history —
 * claiming a refund never reassigns the order to the claiming account, because
 * that would move a guest sale into a member's history for a period when the
 * account did not exist. So this is the page that answers the question, and the
 * SLA date is the reason it exists rather than just a balance line.
 */
export default function MemberRefundsPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("refund");

  const refundsQuery = useQuery({
    queryKey: ["me", "refunds"],
    queryFn: async () => (await memberRefundService.list()).data?.data ?? [],
  });

  const refunds = refundsQuery.data ?? [];

  return (
    <Box className="flex flex-col gap-5">
      <Box className="flex flex-col gap-1">
        <Text as="p" className="font-outfit font-bold text-[20px] text-white leading-tight">
          {t("myRefunds.title")}
        </Text>
        <Text as="p" className="font-inter text-[13px] text-white/55">
          {t("myRefunds.subtitle")}
        </Text>
      </Box>

      {refundsQuery.isError ? (
        <ErrorState onRetry={() => void refundsQuery.refetch()} />
      ) : refundsQuery.isPending ? (
        <Box aria-busy="true" className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-2xl" />
          ))}
        </Box>
      ) : refunds.length === 0 ? (
        <EmptyState compact title={t("myRefunds.empty")} />
      ) : (
        refunds.map((refund) => (
        <Box
          key={refund.refund_number}
          className="rounded-2xl border border-white/10 bg-[rgb(14,20,10)] p-4 md:p-5 flex flex-col gap-3"
        >
          <Box className="flex items-start justify-between gap-3">
            <Box className="flex flex-col gap-0.5 min-w-0">
              <Text as="span" className="font-plex text-[12px] text-white/55 truncate">
                {refund.invoice_number ?? refund.refund_number}
              </Text>
              <Text as="span" className="font-outfit font-semibold text-[14px] text-white truncate">
                {refund.product ?? "—"}
              </Text>
            </Box>
            <Text as="span" className="font-outfit font-bold text-[16px] text-white shrink-0 tabular-nums">
              {formatCurrency(refund.amount, i18n.language)}
            </Text>
          </Box>

          <Box className="h-px bg-white/8" />

          <Box className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Box className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <Text as="span" className="font-inter text-[12px] text-white/70">
                {t(`status.${refund.status}`, { defaultValue: refund.status })}
              </Text>
            </Box>

            {/* Only meaningful before the money moves; afterwards the date the
                balance actually landed is the useful one. */}
            {refund.status !== "COMPLETED" && refund.status !== "REJECTED" && refund.verify_due_at && (
              <Box className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <Text as="span" className="font-inter text-[12px] text-white/55">
                  {t("myRefunds.due")}: {formatDateTime(new Date(refund.verify_due_at), i18n.language)}
                </Text>
              </Box>
            )}

            {refund.refunded_at && (
              <Text as="span" className="font-inter text-[12px] text-green-400">
                {formatDateTime(new Date(refund.refunded_at), i18n.language)}
              </Text>
            )}
          </Box>

          {refund.reject_reason && refund.status === "REJECTED" && (
            <Text as="p" className="font-inter text-[12px] text-red-400 leading-relaxed">
              {refund.reject_reason}
            </Text>
          )}
        </Box>
        ))
      )}
    </Box>
  );
}

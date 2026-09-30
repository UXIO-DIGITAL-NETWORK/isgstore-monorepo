import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { walletService, type BalanceMutationModel } from "@/features/member-dashboard/services/wallet.service";

/** Labels for the ledger's own vocabulary; an unknown type falls back to its description. */
const TYPE_KEYS: Record<string, string> = {
  topup: "balanceHistory.types.topup",
  purchase: "balanceHistory.types.purchase",
  refund: "balanceHistory.types.refund",
  adjustment: "balanceHistory.types.adjustment",
  settlement: "balanceHistory.types.settlement",
};

/**
 * The member's balance statement.
 *
 * The endpoint has existed for a while but nothing rendered it. It earns its
 * place now that failed orders are refunded straight into the balance: a
 * number that grows on its own with no line item to explain it reads as a bug,
 * and support carries every "why is my balance different?" question by hand.
 */
export default function BalanceHistoryCard(): React.JSX.Element {
  const { t, i18n } = useTranslation("dashboard");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["member", "balance-mutations"],
    queryFn: async () => {
      const response = await walletService.mutations();
      return response.data?.data ?? [];
    },
  });

  const label = (row: BalanceMutationModel) => {
    const key = TYPE_KEYS[row.type];
    return key ? t(key) : (row.description ?? row.type);
  };

  return (
    <Box className="rounded-2xl border border-white/10 bg-[rgb(14,20,10)] p-5 flex flex-col gap-4">
      <Text as="p" className="font-outfit font-bold text-[15px] text-white">
        {t("balanceHistory.title")}
      </Text>

      {isLoading && (
        <Text as="p" className="font-inter text-[13px] text-white/45">
          {t("balanceHistory.loading")}
        </Text>
      )}

      {!isLoading && rows.length === 0 && (
        <Text as="p" className="font-inter text-[13px] text-white/45">
          {t("balanceHistory.empty")}
        </Text>
      )}

      {rows.length > 0 && (
        <Box className="flex flex-col divide-y divide-white/5">
          {rows.map((row) => {
            const isCredit = row.amount > 0;

            return (
              <Box key={row.id} className="flex items-center gap-3 py-3">
                <Box
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isCredit ? "bg-green-500/10" : "bg-white/5"
                  }`}
                >
                  {isCredit ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-white/50" />
                  )}
                </Box>

                <Box className="flex min-w-0 flex-1 flex-col">
                  <Text as="span" className="font-inter text-[13px] text-white truncate">
                    {label(row)}
                  </Text>
                  <Text as="span" className="font-inter text-[11px] text-white/40 truncate">
                    {row.description ?? row.reference ?? formatDateTime(new Date(row.created_at), i18n.language)}
                  </Text>
                </Box>

                <Box className="flex shrink-0 flex-col items-end">
                  <Text
                    as="span"
                    className={`font-plex text-[13px] font-bold ${isCredit ? "text-green-400" : "text-white/70"}`}
                  >
                    {isCredit ? "+" : "−"}
                    {formatCurrency(Math.abs(row.amount), i18n.language)}
                  </Text>
                  <Text as="span" className="font-plex text-[11px] text-white/35">
                    {formatCurrency(row.balance_after, i18n.language)}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

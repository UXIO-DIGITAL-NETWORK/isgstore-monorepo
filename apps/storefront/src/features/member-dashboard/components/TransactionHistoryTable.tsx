import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency, formatDateTime } from "@/lib/format";
import TransactionStatusBadge from "@/features/member-dashboard/components/TransactionStatusBadge";
import type { TransactionHistoryRow } from "@/features/member-dashboard/types/dashboard.type";

interface Props {
  rows: TransactionHistoryRow[];
}

export default function TransactionHistoryTable({ rows }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  return (
    <Box className="overflow-hidden">
      <Box as="table" className="w-full border-collapse">
        {/* Header */}
        <Box as="thead">
          <Box as="tr" className="bg-[#3A1D6E]">
            <Box
              as="th"
              className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none"
            >
              {t("transactionHistory.columns.invoice")}
            </Box>
            <Box
              as="th"
              className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none hidden sm:table-cell"
            >
              {t("transactionHistory.columns.service")}
            </Box>
            <Box
              as="th"
              className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none hidden md:table-cell"
            >
              {t("transactionHistory.columns.target")}
            </Box>
            <Box
              as="th"
              className="text-right px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none"
            >
              {t("transactionHistory.columns.price")}
            </Box>
            <Box
              as="th"
              className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none hidden md:table-cell"
            >
              {t("transactionHistory.columns.date")}
            </Box>
            <Box
              as="th"
              className="text-center px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none"
            >
              {t("transactionHistory.columns.status")}
            </Box>
          </Box>
        </Box>

        {/* Body */}
        <Box as="tbody">
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <Box
                as="tr"
                key={row.id}
                className={idx % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"}
              >
                {/* Invoice */}
                <Box as="td" className="px-4 py-3.5 align-middle">
                  <Text
                    as="span"
                    className="text-[12px] font-inter text-white/60 leading-none whitespace-nowrap"
                  >
                    {row.invoiceNumber}
                  </Text>
                </Box>

                {/* Service */}
                <Box as="td" className="px-4 py-3.5 align-middle hidden sm:table-cell">
                  <Box className="flex flex-col gap-0.5">
                    <Text
                      as="span"
                      className="text-[13px] font-inter font-medium text-white leading-tight"
                    >
                      {row.serviceName}
                    </Text>
                    <Text
                      as="span"
                      className="text-[11px] font-inter text-white/40 leading-none"
                    >
                      {row.serviceDetail}
                    </Text>
                  </Box>
                </Box>

                {/* Target */}
                <Box as="td" className="px-4 py-3.5 align-middle hidden md:table-cell">
                  <Text
                    as="span"
                    className="text-[12px] font-inter text-white/50 leading-none"
                  >
                    {row.target}
                  </Text>
                </Box>

                {/* Price + fee breakdown */}
                <Box as="td" className="px-4 py-3.5 align-middle text-right">
                  <Text
                    as="span"
                    className="font-plex font-bold text-[13px] text-white leading-none block"
                  >
                    {formatCurrency(row.amount, locale)}
                  </Text>
                  {row.adminFee > 0 && (
                    <Text as="span" className="font-inter text-[11px] text-white/40 leading-tight block mt-1">
                      {t("transactionHistory.adminFee")}: {formatCurrency(row.adminFee, locale)}
                    </Text>
                  )}
                </Box>

                {/* Date */}
                <Box as="td" className="px-4 py-3.5 align-middle hidden md:table-cell">
                  <Text
                    as="span"
                    className="text-[12px] font-inter text-white/50 leading-none whitespace-nowrap"
                  >
                    {formatDateTime(row.date, locale)}
                  </Text>
                </Box>

                {/* Status */}
                <Box as="td" className="px-4 py-3.5 align-middle text-center">
                  <TransactionStatusBadge status={row.status} />
                </Box>
              </Box>
            ))
          ) : (
            <Box as="tr">
              <Box as="td" className="px-4 py-10 text-center" colSpan={6}>
                <Text as="span" className="text-[13px] font-inter text-white/30">
                  {t("transactionHistory.noTransactions")}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

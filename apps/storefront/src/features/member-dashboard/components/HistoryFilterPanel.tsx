import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Calendar, RotateCcw } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type {
  HistoryFilterValues,
  TransactionPaymentMethod,
} from "@/features/member-dashboard/types/dashboard.type";

interface Props {
  serviceOptions: string[];
  onApply: (values: HistoryFilterValues) => void;
  onReset: () => void;
}

const PAYMENT_METHODS: TransactionPaymentMethod[] = ["bank_transfer", "qris", "ewallet"];

const EMPTY: HistoryFilterValues = {
  service: "",
  payment: "",
  dateFrom: "",
  dateTo: "",
};

export default function HistoryFilterPanel({
  serviceOptions,
  onApply,
  onReset,
}: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const [draft, setDraft] = useState<HistoryFilterValues>(EMPTY);

  const handleReset = () => {
    setDraft(EMPTY);
    onReset();
  };

  const handleApply = () => {
    onApply(draft);
  };

  return (
    // Gradient border wrapper — same pattern as InvoiceSearchCard
    <Box className="p-px rounded-2xl bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)]">
      <Box className="bg-[rgb(14,20,10)] rounded-[15px] p-6 flex flex-col gap-6">
        {/* 3-column filter row */}
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* ── Layanan ── */}
          <Box className="flex flex-col gap-2">
            <Text
              as="span"
              className="text-[13px] font-outfit font-semibold text-white leading-none"
            >
              {t("transactionHistory.filterPanel.service")}
            </Text>
            <Box className="relative">
              <Box
                as="select"
                value={draft.service}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setDraft((prev) => ({ ...prev, service: e.target.value }))
                }
                className="w-full appearance-none bg-[rgb(14,20,10)] border border-white/10 rounded-xl px-4 py-3 pr-10 text-[13px] font-inter text-white outline-none focus:border-[rgb(67,86,32)]/50 transition-colors cursor-pointer"
              >
                <option value="">
                  {t("transactionHistory.filterPanel.allServices")}
                </option>
                {serviceOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Box>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </Box>
          </Box>

          {/* ── Metode Pembayaran ── */}
          <Box className="flex flex-col gap-2">
            <Text
              as="span"
              className="text-[13px] font-outfit font-semibold text-white leading-none"
            >
              {t("transactionHistory.filterPanel.paymentMethod")}
            </Text>
            <Box className="relative">
              <Box
                as="select"
                value={draft.payment}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setDraft((prev) => ({ ...prev, payment: e.target.value }))
                }
                className="w-full appearance-none bg-[rgb(14,20,10)] border border-white/10 rounded-xl px-4 py-3 pr-10 text-[13px] font-inter text-white outline-none focus:border-[rgb(67,86,32)]/50 transition-colors cursor-pointer"
              >
                <option value="">
                  {t("transactionHistory.filterPanel.allMethods")}
                </option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t(`transactionHistory.filterPanel.paymentMethods.${method}`)}
                  </option>
                ))}
              </Box>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </Box>
          </Box>

          {/* ── Tanggal (date range) ── */}
          <Box className="flex flex-col gap-2">
            <Text
              as="span"
              className="text-[13px] font-outfit font-semibold text-white leading-none"
            >
              {t("transactionHistory.filterPanel.date")}
            </Text>
            <Box className="flex items-center gap-2 bg-[rgb(14,20,10)] border border-white/10 rounded-xl px-4 py-3">
              <Calendar className="w-4 h-4 text-white/40 shrink-0" />
              <Box
                as="input"
                type="date"
                value={draft.dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDraft((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="flex-1 min-w-0 bg-transparent text-[12px] font-inter text-white/70 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <Text as="span" className="text-white/30 shrink-0 text-[13px]">
                -
              </Text>
              <Box
                as="input"
                type="date"
                value={draft.dateTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDraft((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="flex-1 min-w-0 bg-transparent text-[12px] font-inter text-white/70 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <Calendar className="w-4 h-4 text-white/40 shrink-0" />
            </Box>
          </Box>
        </Box>

        {/* ── Action buttons ── */}
        <Box className="flex justify-end gap-3">
          {/* Reset Filter */}
          <Box
            as="button"
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[13px] font-outfit font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("transactionHistory.filterPanel.resetFilter")}
          </Box>

          {/* Terapkan Filter */}
          <Box
            as="button"
            type="button"
            onClick={handleApply}
            className="flex items-center px-6 py-2.5 rounded-full bg-[rgb(208,201,129)] text-[13px] font-outfit font-bold text-white hover:bg-[rgb(39,53,15)] transition-colors cursor-pointer"
          >
            {t("transactionHistory.filterPanel.applyFilter")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

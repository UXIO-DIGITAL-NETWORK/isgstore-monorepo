import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useIsiSaldo } from "@/features/member-dashboard/hooks/useIsiSaldo";
import NominalSelector from "@/features/member-dashboard/components/isiSaldo/NominalSelector";
import PaymentSelector from "@/features/member-dashboard/components/isiSaldo/PaymentSelector";
import SummaryCard from "@/features/member-dashboard/components/isiSaldo/SummaryCard";
import SaldoCard from "@/features/member-dashboard/components/isiSaldo/SaldoCard";
import BalanceHistoryCard from "@/features/member-dashboard/components/isiSaldo/BalanceHistoryCard";

export default function IsiSaldoPage(): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const {
    presets,
    paymentGroups,
    isSubmitting,
    submitError,
    handleSubmit,
    selectedNominal,
    selectedPaymentId,
    nominal,
    selectedPaymentName,
    handleSelectPreset,
    handleCustomChange,
    handleSelectPayment,
    paymentQuery,
  } = useIsiSaldo();

  return (
    <Box className="flex flex-col gap-6">
      {/* Page header */}
      <Box className="flex flex-col gap-1">
        <Box className="flex items-center gap-3">
          <Box className="w-1 h-5 rounded-full bg-[rgb(67,86,32)] shrink-0" />
          <Text
            as="span"
            className="font-outfit font-bold text-[22px] uppercase tracking-[-0.3px] text-white leading-none"
          >
            {t("isiSaldo.title")}
          </Text>
        </Box>
        <Text as="span" className="text-[13px] font-inter text-white/50 leading-none pl-4">
          {t("isiSaldo.subtitle")}
        </Text>
      </Box>

      {/* Two-column responsive grid */}
      <Box className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">

        {/* ── Left column: sections 1 → summary ── */}
        <Box className="flex flex-col gap-5">
          <NominalSelector
            presets={presets}
            selectedNominal={selectedNominal}
            onSelectPreset={handleSelectPreset}
            onCustomChange={handleCustomChange}
          />

          <PaymentSelector
            groups={paymentGroups}
            selectedPaymentId={selectedPaymentId}
            onSelectPayment={handleSelectPayment}
            isLoading={paymentQuery.isPending}
            isError={paymentQuery.isError}
            onRetry={() => void paymentQuery.refetch()}
          />

          <SummaryCard
            total={nominal}
            selectedPaymentName={selectedPaymentName}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
          />
        </Box>

        {/* ── Right column: Saldo Anda (sticky on desktop) ── */}
        <Box className="lg:sticky lg:top-[120px] self-start flex flex-col gap-5">
          <SaldoCard />
          <BalanceHistoryCard />
        </Box>
      </Box>
    </Box>
  );
}

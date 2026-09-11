import { useTranslation } from "react-i18next";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { StatCard } from "@/components/common/StatCard";
import { WebsiteServicesCard } from "../components/WebsiteServicesCard";
import { useMerchantDashboard } from "../hooks/useMerchant";

export default function MerchantDashboardPage() {
  const { t } = useTranslation("merchant");
  const { data } = useMerchantDashboard();

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("dashboard.title")}</Heading>

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          data={{
            id: "saldo",
            label: t("dashboard.balanceActive"),
            value: data?.saldo_aktif ?? 0,
            caption: t("dashboard.balanceActiveCaption"),
          }}
        />
        <StatCard
          data={{
            id: "pending",
            label: t("dashboard.balancePending"),
            value: data?.saldo_pending ?? 0,
            caption: t("dashboard.balancePendingCaption"),
          }}
        />
        {/* Earned but still inside the per-channel holding period — without
            this card a freshly-paid sale reads as "missing money". */}
        <StatCard
          data={{
            id: "tertahan",
            label: t("dashboard.balanceHeld"),
            value: data?.saldo_tertahan ?? 0,
            caption: t("dashboard.balanceHeldCaption"),
          }}
        />
        <StatCard
          data={{
            id: "penjualan",
            label: t("dashboard.totalSales"),
            value: data?.total_penjualan ?? 0,
            caption: t("dashboard.totalSalesCaption"),
          }}
        />
        <StatCard
          data={{
            id: "penarikan",
            label: t("dashboard.totalWithdrawals"),
            value: data?.total_penarikan ?? 0,
            caption: t("dashboard.totalWithdrawalsCaption"),
          }}
        />
        <StatCard
          data={{
            id: "transaksi",
            label: t("dashboard.totalTransactions"),
            value: data?.total_transaksi ?? 0,
            format: "count",
            caption: t("dashboard.totalTransactionsCaption"),
          }}
        />
      </Box>

      <WebsiteServicesCard activeUntil={data?.service_active_until ?? null} />
    </Box>
  );
}

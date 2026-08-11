import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { StatCard } from "@/components/common/StatCard";
import { useFinanceDashboard } from "../hooks/useFinance";

export default function FinanceDashboardPage() {
  const { data } = useFinanceDashboard();

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Dashboard</Heading>

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          data={{ id: "saldo", label: "Saldo (Profit)", value: data?.saldo ?? 0, caption: "Akumulasi markup admin fee" }}
        />
        <StatCard
          data={{ id: "markup", label: "Total Markup", value: data?.total_markup ?? 0, caption: "Admin fee dari seluruh transaksi" }}
        />
        <StatCard
          data={{ id: "gateway", label: "Total Fee Gateway", value: data?.total_gateway_fee ?? 0, caption: "Fee Monetapay" }}
        />
        <StatCard
          data={{ id: "settled", label: "Disetorkan ke Merchant", value: data?.total_settled_to_merchants ?? 0, caption: "Penjualan bersih merchant" }}
        />
        <StatCard
          data={{ id: "pending", label: "Penarikan Pending", value: data?.pending_withdrawals ?? 0, format: "count", caption: "Menunggu persetujuan" }}
        />
        <StatCard
          data={{ id: "pending-amt", label: "Nominal Pending", value: data?.pending_withdrawals_amount ?? 0, caption: "Total nominal menunggu" }}
        />
      </Box>
    </Box>
  );
}

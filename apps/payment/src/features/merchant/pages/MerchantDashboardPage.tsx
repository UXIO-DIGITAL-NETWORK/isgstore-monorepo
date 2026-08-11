import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { StatCard } from "@/components/common/StatCard";
import { useMerchantDashboard } from "../hooks/useMerchant";

export default function MerchantDashboardPage() {
  const { data } = useMerchantDashboard();

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Dashboard</Heading>

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          data={{
            id: "saldo",
            label: "Saldo Aktif",
            value: data?.saldo_aktif ?? 0,
            caption: "Saldo yang dapat ditarik",
          }}
        />
        <StatCard
          data={{
            id: "pending",
            label: "Saldo Pending",
            value: data?.saldo_pending ?? 0,
            caption: "Menunggu persetujuan penarikan",
          }}
        />
        <StatCard
          data={{
            id: "penjualan",
            label: "Total Penjualan",
            value: data?.total_penjualan ?? 0,
            caption: "Penjualan bersih (net)",
          }}
        />
        <StatCard
          data={{
            id: "penarikan",
            label: "Total Penarikan",
            value: data?.total_penarikan ?? 0,
            caption: "Penarikan yang telah cair",
          }}
        />
        <StatCard
          data={{
            id: "transaksi",
            label: "Total Transaksi",
            value: data?.total_transaksi ?? 0,
            format: "count",
            caption: "Jumlah transaksi",
          }}
        />
      </Box>
    </Box>
  );
}

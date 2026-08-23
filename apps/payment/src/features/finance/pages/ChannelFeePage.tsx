import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/currency";
import { useChannelFees, useUpdateChannelFee } from "../hooks/useFinance";
import { simulateChannel } from "../lib/channelSimulation";
import type { ChannelFee } from "../types/finance.type";

type RowDraft = Partial<
  Pick<ChannelFee, "fee_flat" | "fee_percent" | "gateway_fee_flat" | "gateway_fee_percent" | "is_active">
>;

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

export default function ChannelFeePage() {
  const { data, isLoading, isError } = useChannelFees();
  const { mutate: save, isPending } = useUpdateChannelFee();

  // Only edited overrides are tracked; unedited fields fall back to the row's
  // fetched value. This avoids seeding state from props via an effect.
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  // Simulation inputs: fee percent scales with the nominal, so tax/profit need a
  // reference amount. Pure preview — nothing here is persisted.
  const [amount, setAmount] = useState(60000);
  const [taxRate, setTaxRate] = useState(11);

  const patch = (id: number, next: RowDraft) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...next } }));

  const merged = (row: ChannelFee): Required<RowDraft> => ({
    fee_flat: drafts[row.id]?.fee_flat ?? row.fee_flat,
    fee_percent: drafts[row.id]?.fee_percent ?? row.fee_percent,
    gateway_fee_flat: drafts[row.id]?.gateway_fee_flat ?? row.gateway_fee_flat,
    gateway_fee_percent: drafts[row.id]?.gateway_fee_percent ?? row.gateway_fee_percent,
    is_active: drafts[row.id]?.is_active ?? row.is_active,
  });

  const columns: Column<ChannelFee>[] = [
    { key: "name", header: "Metode", cell: (r) => <Text as="span" className="font-medium">{r.name}</Text> },
    { key: "type", header: "Tipe", cell: (r) => r.payment_type },
    {
      key: "fee_flat",
      header: "Biaya Flat (Rp)",
      className: "w-40",
      cell: (r) => (
        <Input
          type="number"
          value={merged(r).fee_flat}
          onChange={(e) => patch(r.id, { fee_flat: Number(e.target.value) })}
        />
      ),
    },
    {
      key: "fee_percent",
      header: "Biaya Persen (%)",
      className: "w-40",
      cell: (r) => (
        <Input
          type="number"
          step="0.01"
          value={merged(r).fee_percent}
          onChange={(e) => patch(r.id, { fee_percent: Number(e.target.value) })}
        />
      ),
    },
    {
      key: "gateway_fee_flat",
      header: "Fee Gateway (Rp)",
      className: "w-40",
      cell: (r) => (
        <Input
          type="number"
          value={merged(r).gateway_fee_flat}
          onChange={(e) => patch(r.id, { gateway_fee_flat: Number(e.target.value) })}
        />
      ),
    },
    {
      key: "gateway_fee_percent",
      header: "Fee Gateway (%)",
      className: "w-40",
      cell: (r) => (
        <Input
          type="number"
          step="0.01"
          value={merged(r).gateway_fee_percent}
          onChange={(e) => patch(r.id, { gateway_fee_percent: Number(e.target.value) })}
        />
      ),
    },
    {
      key: "sim_fee",
      header: "Fee (Rp)",
      className: "w-32 text-right tabular-nums",
      cell: (r) => money(simulateChannel(merged(r), amount, taxRate).fee),
    },
    {
      key: "sim_tax",
      header: "Pajak (Rp)",
      className: "w-32 text-right tabular-nums",
      cell: (r) => (
        <Text as="span" className="text-destructive">
          {money(simulateChannel(merged(r), amount, taxRate).tax)}
        </Text>
      ),
    },
    {
      key: "sim_profit",
      header: "Untung (Rp)",
      className: "w-32 text-right tabular-nums",
      cell: (r) => {
        const profit = simulateChannel(merged(r), amount, taxRate).profit;
        return (
          <Text as="span" className={profit >= 0 ? "text-success" : "text-destructive"}>
            {money(profit)}
          </Text>
        );
      },
    },
    {
      key: "is_active",
      header: "Status",
      cell: (r) => {
        const active = merged(r).is_active;
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-0"
            onClick={() => patch(r.id, { is_active: !active })}
          >
            <StatusBadge status={active ? "SETTLED" : "EXPIRED"} />
          </Button>
        );
      },
    },
    {
      key: "actions",
      header: "Aksi",
      cell: (r) => (
        <Button size="sm" disabled={isPending} onClick={() => save({ id: r.id, payload: merged(r) })}>
          Simpan
        </Button>
      ),
    },
  ];

  // Totals across active channels at the simulation nominal — an illustrative
  // "1 transaksi per channel" snapshot so tax and profit stay in view.
  const totals = (data ?? [])
    .filter((r) => merged(r).is_active)
    .reduce(
      (acc, r) => {
        const sim = simulateChannel(merged(r), amount, taxRate);
        acc.fee += sim.fee;
        acc.tax += sim.tax;
        acc.profit += sim.profit;
        return acc;
      },
      { fee: 0, tax: 0, profit: 0 },
    );

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Biaya per Metode Pembayaran</Heading>
      <Text variant="small">
        Atur biaya flat dan/atau persen untuk tiap metode pembayaran, serta aktif/nonaktifkan channel.
        Kolom Fee, Pajak, dan Untung disimulasikan pada nominal & tarif pajak di bawah — hanya
        pratinjau, tidak tersimpan.
      </Text>

      <Box className="flex flex-wrap items-end gap-4">
        <Box className="flex flex-col gap-1">
          <Text as="span" variant="small" className="font-medium">
            Nominal simulasi (Rp)
          </Text>
          <Input
            type="number"
            aria-label="Nominal simulasi (Rp)"
            className="w-48"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Box>
        <Box className="flex flex-col gap-1">
          <Text as="span" variant="small" className="font-medium">
            Tarif Pajak / PPN (%)
          </Text>
          <Input
            type="number"
            step="0.01"
            aria-label="Tarif Pajak / PPN (%)"
            className="w-40"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </Box>
      </Box>

      <SimpleTable
        columns={columns}
        rows={data ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada channel"
        rowKey={(r) => r.id}
      />

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Fee", value: totals.fee, tone: "" },
          { label: "Total Pajak", value: totals.tax, tone: "text-destructive" },
          {
            label: "Total Keuntungan Bersih",
            value: totals.profit,
            tone: totals.profit >= 0 ? "text-success" : "text-destructive",
          },
        ].map((t) => (
          <Box
            key={t.label}
            data-testid="sim-total"
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
          >
            <Text as="span" variant="small" className="font-medium text-muted-foreground">
              {t.label}
            </Text>
            <Text as="div" className={`text-2xl font-semibold tabular-nums ${t.tone}`}>
              {money(t.value)}
            </Text>
          </Box>
        ))}
      </Box>
      <Text variant="small" className="text-muted-foreground">
        Asumsi 1 transaksi per channel aktif pada nominal simulasi. Untung = fee channel − fee
        gateway − pajak.
      </Text>
    </Box>
  );
}

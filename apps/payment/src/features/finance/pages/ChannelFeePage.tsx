import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChannelFees, useUpdateChannelFee } from "../hooks/useFinance";
import type { ChannelFee } from "../types/finance.type";

type RowDraft = Partial<
  Pick<
    ChannelFee,
    "fee_flat" | "fee_percent" | "gateway_fee_flat" | "gateway_fee_percent" | "tax_percent" | "is_active"
  >
>;

export default function ChannelFeePage() {
  const { data, isLoading, isError } = useChannelFees();
  const { mutate: save, isPending } = useUpdateChannelFee();

  // Only edited overrides are tracked; unedited fields fall back to the row's
  // fetched value. This avoids seeding state from props via an effect.
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  const patch = (id: number, next: RowDraft) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...next } }));

  const merged = (row: ChannelFee): Required<RowDraft> => ({
    fee_flat: drafts[row.id]?.fee_flat ?? row.fee_flat,
    fee_percent: drafts[row.id]?.fee_percent ?? row.fee_percent,
    gateway_fee_flat: drafts[row.id]?.gateway_fee_flat ?? row.gateway_fee_flat,
    gateway_fee_percent: drafts[row.id]?.gateway_fee_percent ?? row.gateway_fee_percent,
    tax_percent: drafts[row.id]?.tax_percent ?? row.tax_percent,
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
      key: "tax_percent",
      header: "Pajak (%)",
      className: "w-40",
      cell: (r) => (
        <Input
          type="number"
          step="0.01"
          aria-label={`Pajak ${r.name}`}
          value={merged(r).tax_percent}
          onChange={(e) => patch(r.id, { tax_percent: Number(e.target.value) })}
        />
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (r) => {
        const active = merged(r).is_active;
        // Toggle the draft; persists together with the row's other edits on Simpan.
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 p-0"
            aria-label={`${active ? "Nonaktifkan" : "Aktifkan"} ${r.name}`}
            onClick={() => patch(r.id, { is_active: !active })}
          >
            <StatusBadge status={active ? "SETTLED" : "EXPIRED"} />
            <Text as="span" variant="small">{active ? "Aktif" : "Nonaktif"}</Text>
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

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Biaya per Metode Pembayaran</Heading>
      <Text variant="small">
        Atur biaya flat/persen, fee gateway, dan pajak (PPN) tiap metode pembayaran, serta
        aktif/nonaktifkan channel. Pajak dikenakan atas fee channel dan mengurangi keuntungan kita
        (tidak menambah tagihan customer). Klik Simpan untuk menerapkan.
      </Text>
      <SimpleTable
        columns={columns}
        rows={data ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada channel"
        rowKey={(r) => r.id}
      />
    </Box>
  );
}

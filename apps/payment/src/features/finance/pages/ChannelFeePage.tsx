import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChannelFees, useChannelMeta, useUpdateChannelFee } from "../hooks/useFinance";
import type { ChannelFee } from "../types/finance.type";

type RowDraft = Partial<
  Pick<
    ChannelFee,
    "fee_flat" | "fee_percent" | "gateway_fee_flat" | "gateway_fee_percent" | "tax_percent" | "is_active"
  >
>;

export default function ChannelFeePage() {
  const { data, isLoading, isError } = useChannelFees();
  const { data: meta } = useChannelMeta();
  const { mutate: save, isPending } = useUpdateChannelFee();

  // When the Hub owns the schedule, the update route 422s for every row it
  // syncs. Without this the page gives no hint at all: you type a number, click
  // Simpan, and are told no. Scoped per row — `balance` and `payment_link` are
  // not in the Hub's master and stay editable here.
  const lockedFor = (row: ChannelFee) => (meta?.hub_managed ?? false) && row.hub_managed;

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
          disabled={lockedFor(r)}
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
          disabled={lockedFor(r)}
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
        <Box className="flex flex-col gap-1">
          <Input
            type="number"
            disabled={lockedFor(r)}
            value={merged(r).gateway_fee_flat}
            onChange={(e) => patch(r.id, { gateway_fee_flat: Number(e.target.value) })}
          />
          {/* Already in the payload, never shown until now — this is the same
              divergence the Discord alarm shouts about, and it silently
              under/over-reports profit at settlement. */}
          {r.contract_mismatch && (
            <Text as="span" variant="small" className="text-warning">
              {r.contract_expected
                ? `≠ kontrak ${r.contract_expected.gateway_fee_flat}+${r.contract_expected.gateway_fee_percent}%`
                : "tidak ada di kontrak Monetapay"}
            </Text>
          )}
        </Box>
      ),
    },
    {
      key: "gateway_fee_percent",
      header: "Fee Gateway (%)",
      className: "w-40",
      cell: (r) => (
        <Input
          type="number"
          disabled={lockedFor(r)}
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
          disabled={lockedFor(r)}
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
            disabled={lockedFor(r)}
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
        <Button
          size="sm"
          disabled={isPending || lockedFor(r)}
          onClick={() => save({ id: r.id, payload: merged(r) })}
        >
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

      {meta?.hub_managed && (
        <Box className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Text
            as="p"
            variant="small"
            className="text-muted-foreground"
          >
            {meta.managed_note ??
              "Channel dikelola di Hub. Ubah biaya, status aktif, dan minimum dari panel Hub — perubahan lokal akan tertimpa sinkronisasi."}
          </Text>
        </Box>
      )}

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

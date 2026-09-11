import { useTranslation } from "react-i18next";
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
import { formatCurrency } from "@/utils/currency";

type RowDraft = Partial<
  Pick<
    ChannelFee,
    "fee_flat" | "fee_percent" | "gateway_fee_flat" | "gateway_fee_percent" | "tax_percent" | "is_active"
  >
>;

export default function ChannelFeePage() {
  const { t } = useTranslation("finance");
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
    { key: "name", header: t("channelFees.colMethod"), cell: (r) => <Text as="span" className="font-medium">{r.name}</Text> },
    { key: "type", header: t("channelFees.colType"), cell: (r) => r.payment_type },
    {
      key: "fee_flat",
      header: t("channelFees.colFeeFlat"),
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
      header: t("channelFees.colFeePercent"),
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
      header: t("channelFees.colGatewayFlat"),
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
                ? `≠ kontrak ${formatCurrency(r.contract_expected.gateway_fee_flat, { fractionDigits: 0 })} + ${r.contract_expected.gateway_fee_percent}%`
                : "tidak ada di kontrak Monetapay"}
            </Text>
          )}
        </Box>
      ),
    },
    {
      key: "gateway_fee_percent",
      header: t("channelFees.colGatewayPercent"),
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
      header: t("channelFees.colTax"),
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
      header: t("channelFees.colStatus"),
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
      header: t("channelFees.colAction"),
      cell: (r) => (
        <Button
          size="sm"
          disabled={isPending || lockedFor(r)}
          onClick={() => save({ id: r.id, payload: merged(r) })}
        >
          {t("channelFees.save")}
        </Button>
      ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("channelFees.title")}</Heading>
      <Text variant="small">
        {t("channelFees.description")}
      </Text>

      {meta?.hub_managed && (
        <Box className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Text
            as="p"
            variant="small"
            className="text-muted-foreground"
          >
            {meta.managed_note ?? t("channelFees.hubManagedNote")}
          </Text>
        </Box>
      )}

      <SimpleTable
        columns={columns}
        rows={data ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("channelFees.empty")}
        rowKey={(r) => r.id}
      />
    </Box>
  );
}

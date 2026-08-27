import { useState } from "react";

import { Box } from "@/components/common/Box";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { Pager } from "@/components/common/Pager";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/currency";
import type { Service } from "@/types/service.type";

import { ServiceFormDialog } from "../components/ServiceFormDialog";
import { useDeleteService, useFinanceServices, useServicesMeta } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

export default function FinanceServicesPage() {
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const { data, isLoading, isError } = useFinanceServices({ page, per_page: 20 });
  const { data: meta } = useServicesMeta();
  const { mutate: remove } = useDeleteService();

  // When the catalogue is owned by the Hub, the create/edit/delete routes are
  // 422'd server-side, and cost_price stops syncing down (it is Hub-private), so
  // the local margin goes stale. Drop the write controls and the cost/margin
  // columns and point the operator at the Hub panel.
  const hubManaged = meta?.hub_managed ?? false;

  const columns: Column<Service>[] = [
    {
      key: "name",
      header: "Service",
      cell: (r) => (
        <Box className="flex flex-col">
          <Text
            as="span"
            className="font-medium"
          >
            {r.name}
          </Text>
          <Text
            as="span"
            variant="small"
            className="text-muted-foreground"
          >
            {r.code}
          </Text>
        </Box>
      ),
    },
    {
      key: "category",
      header: "Kategori",
      // A category is not a status, so it gets a plain badge rather than the
      // tone-mapped StatusBadge.
      cell: (r) => <Badge variant="secondary">{r.category_label}</Badge>,
    },
    ...(hubManaged
      ? []
      : ([
          {
            key: "cost_price",
            header: "Cost Price",
            className: "text-right tabular-nums",
            cell: (r) => money(r.cost_price ?? 0),
          },
        ] as Column<Service>[])),
    {
      key: "selling_price",
      header: "Selling Price",
      className: "text-right tabular-nums",
      cell: (r) => money(r.selling_price),
    },
    ...(hubManaged
      ? []
      : ([
          {
            key: "margin",
            header: "Margin",
            className: "text-right tabular-nums",
            // Gross margin: against the selling price, which is what the operator
            // compares across services. Derived here rather than stored, so it can
            // never disagree with the two numbers beside it.
            cell: (r) => {
              const margin = r.selling_price - (r.cost_price ?? 0);
              const percent = r.selling_price > 0 ? (margin / r.selling_price) * 100 : 0;

              return (
                <Box className="flex flex-col items-end">
                  <Text
                    as="span"
                    className={margin < 0 ? "text-destructive" : undefined}
                  >
                    {money(margin)}
                  </Text>
                  <Text
                    as="span"
                    variant="small"
                    className="text-muted-foreground"
                  >
                    {percent.toFixed(1)}%
                  </Text>
                </Box>
              );
            },
          },
        ] as Column<Service>[])),
    {
      key: "duration",
      header: "Masa Aktif",
      className: "text-right tabular-nums",
      cell: (r) => `${r.duration_days} hari`,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={r.is_active ? "default" : "outline"}>{r.is_active ? "Aktif" : "Nonaktif"}</Badge>,
    },
    ...(hubManaged
      ? []
      : ([
          {
            key: "actions",
            header: "Aksi",
            cell: (r) => (
              <Box className="flex gap-2">
                <ServiceFormDialog service={r} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingDelete(r)}
                >
                  Hapus
                </Button>
              </Box>
            ),
          },
        ] as Column<Service>[])),
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex items-center justify-between">
        <Heading level={1}>Product / Services</Heading>
        {!hubManaged && <ServiceFormDialog />}
      </Box>

      {hubManaged && (
        <Box className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Text
            as="p"
            variant="small"
            className="text-muted-foreground"
          >
            {meta?.managed_note ??
              "Katalog service dikelola di Hub. Ubah harga, kategori, dan masa aktif dari panel Hub — perubahan lokal akan tertimpa sinkronisasi."}
          </Text>
        </Box>
      )}

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada service"
        rowKey={(r) => r.id}
      />

      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Hapus service ini?"
        description={
          pendingDelete
            ? `${pendingDelete.name} akan dihapus dari katalog. Service yang sudah punya invoice atau langganan tidak dapat dihapus — nonaktifkan saja.`
            : ""
        }
        confirmLabel="Hapus"
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </Box>
  );
}

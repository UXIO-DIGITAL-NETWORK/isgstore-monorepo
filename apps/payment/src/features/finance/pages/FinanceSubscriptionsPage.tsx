import { useTranslation } from "react-i18next";
import { useState } from "react";

import { Box } from "@/components/common/Box";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date";
import type { ServiceSubscription } from "@/types/service.type";

import { useCancelSubscription, useServiceSubscriptions } from "../hooks/useFinance";

export default function FinanceSubscriptionsPage() {
  const { t } = useTranslation("finance");
  const [page, setPage] = useState(1);
  const [pendingCancel, setPendingCancel] = useState<ServiceSubscription | null>(null);
  const { data, isLoading, isError } = useServiceSubscriptions({ page, per_page: 20 });
  const { mutate: cancel } = useCancelSubscription();

  const columns: Column<ServiceSubscription>[] = [
    { key: "merchant", header: t("subscriptions.colClient"), cell: (r) => r.merchant?.name ?? "-" },
    {
      key: "service",
      header: t("subscriptions.colService"),
      cell: (r) => (
        <Text
          as="span"
          className="font-medium"
        >
          {r.service?.name ?? "-"}
        </Text>
      ),
    },
    {
      key: "period",
      header: t("subscriptions.colPeriod"),
      cell: (r) => `${formatDate(r.starts_at)} – ${formatDate(r.ends_at)}`,
    },
    {
      key: "remaining",
      header: t("subscriptions.colRemaining"),
      className: "text-right tabular-nums",
      cell: (r) => `${r.days_remaining} hari`,
    },
    { key: "status", header: t("subscriptions.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
    { key: "invoice", header: t("subscriptions.colInvoice"), cell: (r) => r.invoice_number ?? "—" },
    {
      key: "actions",
      header: t("subscriptions.colAction"),
      cell: (r) => (
        <Box className="flex gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link href={`/app/payment-internal/subscriptions/${r.id}`}>{t("subscriptions.manage")}</Link>
          </Button>
          {r.status === "ACTIVE" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPendingCancel(r)}
            >
              Batalkan
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("subscriptions.title")}</Heading>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("subscriptions.empty")}
        rowKey={(r) => r.id}
      />

      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />

      <DeleteConfirmDialog
        open={pendingCancel !== null}
        onOpenChange={(next) => {
          if (!next) setPendingCancel(null);
        }}
        title={t("subscriptions.cancelTitle")}
        description={
          pendingCancel
            ? t("subscriptions.cancelDescription", {
                client: pendingCancel.merchant?.name ?? t("subscriptions.fallbackClient"),
                service: pendingCancel.service?.name ?? t("subscriptions.fallbackService"),
                date: formatDate(pendingCancel.ends_at),
              })
            : ""
        }
        confirmLabel={t("subscriptions.cancelConfirm")}
        onConfirm={() => {
          if (pendingCancel) cancel(pendingCancel.id);
          setPendingCancel(null);
        }}
      />
    </Box>
  );
}

import { useState } from "react";

import { Box } from "@/components/common/Box";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { InstallationProgress } from "@/components/common/InstallationProgress";
import { Link } from "@/components/common/Link";
import { SecretValue } from "@/components/common/SecretValue";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate, formatDateTime } from "@/utils/date";
import type { ServiceInstallationDetail, ServiceInstallationStep } from "@/types/service.type";

import { DetailItemFormDialog } from "../components/DetailItemFormDialog";
import { InstallationWindowDialog } from "../components/InstallationWindowDialog";
import { StepFormDialog } from "../components/StepFormDialog";
import {
  useDeleteDetailItem,
  useDeleteStep,
  useFinanceInstallation,
  useFinanceSubscription,
  useRevealFinanceDetail,
  useSetStepCompletion,
} from "../hooks/useFinance";

interface FinanceSubscriptionDetailPageProps {
  subscriptionId: number;
}

/**
 * Kita's workbench for one client's service: the period, the installation
 * schedule and checklist, and the credentials handed over.
 *
 * A page rather than a panel in the list — the URL is the thing an operator
 * actually shares ("kirim link instalasi Digiflazz client itu"), and three
 * independently-editable collections do not fit in a dialog.
 */
export default function FinanceSubscriptionDetailPage({ subscriptionId }: FinanceSubscriptionDetailPageProps) {
  const [pendingStep, setPendingStep] = useState<ServiceInstallationStep | null>(null);
  const [pendingDetail, setPendingDetail] = useState<ServiceInstallationDetail | null>(null);

  const { data: subscription, isLoading, isError } = useFinanceSubscription(subscriptionId);
  const { data: installation, isLoading: loadingInstallation } = useFinanceInstallation(subscriptionId);
  const { mutate: setCompletion } = useSetStepCompletion(subscriptionId);
  const { mutate: deleteStep } = useDeleteStep(subscriptionId);
  const { mutate: deleteDetail } = useDeleteDetailItem(subscriptionId);
  const { mutateAsync: reveal } = useRevealFinanceDetail();

  if (isLoading) {
    return <Text variant="small">Memuat…</Text>;
  }

  if (isError || !subscription) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>Langganan tidak ditemukan</Heading>
        <Link
          href="/app/payment-internal/subscriptions"
          className="underline"
        >
          Kembali ke daftar langganan
        </Link>
      </Box>
    );
  }

  const installationId = installation?.id;

  const stepColumns: Column<ServiceInstallationStep>[] = [
    {
      key: "done",
      header: "Selesai",
      cell: (r) => (
        <Checkbox
          checked={r.is_completed}
          aria-label={`Tandai ${r.title}`}
          // Sends the desired state, not a flip, so two open tabs converge.
          onCheckedChange={(checked) => setCompletion({ id: r.id, completed: checked === true })}
        />
      ),
    },
    { key: "order", header: "Urutan", className: "tabular-nums", cell: (r) => r.sort_order },
    {
      key: "title",
      header: "Tahapan",
      cell: (r) => (
        <Box className="flex flex-col">
          <Text
            as="span"
            className="font-medium"
          >
            {r.title}
          </Text>
          {r.description && (
            <Text
              as="span"
              variant="small"
              className="text-muted-foreground"
            >
              {r.description}
            </Text>
          )}
        </Box>
      ),
    },
    { key: "completed_at", header: "Selesai Pada", cell: (r) => formatDateTime(r.completed_at) },
    {
      key: "actions",
      header: "Aksi",
      cell: (r) => (
        <Box className="flex gap-2">
          <StepFormDialog
            subscriptionId={subscriptionId}
            installationId={installationId}
            step={r}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingStep(r)}
          >
            Hapus
          </Button>
        </Box>
      ),
    },
  ];

  const detailColumns: Column<ServiceInstallationDetail>[] = [
    { key: "label", header: "Label", cell: (r) => r.label },
    {
      key: "value",
      header: "Nilai",
      cell: (r) => (
        <SecretValue
          detail={r}
          reveal={reveal}
        />
      ),
    },
    {
      key: "secret",
      header: "Rahasia",
      cell: (r) => (r.is_secret ? <Badge variant="secondary">Ya</Badge> : <Badge variant="outline">Tidak</Badge>),
    },
    {
      key: "actions",
      header: "Aksi",
      cell: (r) => (
        <Box className="flex gap-2">
          <DetailItemFormDialog
            subscriptionId={subscriptionId}
            installationId={installationId}
            detail={r}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingDetail(r)}
          >
            Hapus
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-internal/subscriptions"
          className="text-sm text-muted-foreground underline"
        >
          ← Kembali ke Subscription
        </Link>
        <Heading level={1}>{subscription.service?.name ?? "Langganan"}</Heading>
      </Box>

      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Heading level={2}>{subscription.merchant?.name ?? "Client"}</Heading>
          <StatusBadge status={subscription.status} />
        </Box>
        <Text variant="small">
          Periode {formatDate(subscription.starts_at)} – {formatDate(subscription.ends_at)} ·{" "}
          {subscription.days_remaining} hari tersisa
        </Text>
        {subscription.invoice_number && (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            Invoice {subscription.invoice_number}
          </Text>
        )}
      </Box>

      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between gap-2">
          <Heading level={2}>Jadwal Instalasi</Heading>
          <InstallationWindowDialog
            subscriptionId={subscriptionId}
            installation={installation}
          />
        </Box>
        <InstallationProgress
          installation={installation}
          isLoading={loadingInstallation}
        />
      </Box>

      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between gap-2">
          <Heading level={2}>Tahapan</Heading>
          <StepFormDialog
            subscriptionId={subscriptionId}
            installationId={installationId}
          />
        </Box>
        <SimpleTable
          columns={stepColumns}
          rows={installation?.steps ?? []}
          isLoading={loadingInstallation}
          emptyLabel="Belum ada tahapan"
          rowKey={(r) => r.id}
        />
      </Box>

      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between gap-2">
          <Heading level={2}>Detail Layanan</Heading>
          <DetailItemFormDialog
            subscriptionId={subscriptionId}
            installationId={installationId}
          />
        </Box>
        <SimpleTable
          columns={detailColumns}
          rows={installation?.details ?? []}
          isLoading={loadingInstallation}
          emptyLabel="Belum ada detail layanan"
          rowKey={(r) => r.id}
        />
      </Box>

      <DeleteConfirmDialog
        open={pendingStep !== null}
        onOpenChange={(next) => {
          if (!next) setPendingStep(null);
        }}
        title="Hapus tahapan ini?"
        description={pendingStep ? `"${pendingStep.title}" akan dihapus dan progress dihitung ulang.` : ""}
        confirmLabel="Hapus"
        onConfirm={() => {
          if (pendingStep) deleteStep(pendingStep.id);
          setPendingStep(null);
        }}
      />

      <DeleteConfirmDialog
        open={pendingDetail !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDetail(null);
        }}
        title="Hapus detail ini?"
        description={
          pendingDetail
            ? `"${pendingDetail.label}" akan dihapus. Client tidak akan bisa melihatnya lagi.`
            : ""
        }
        confirmLabel="Hapus"
        onConfirm={() => {
          if (pendingDetail) deleteDetail(pendingDetail.id);
          setPendingDetail(null);
        }}
      />
    </Box>
  );
}

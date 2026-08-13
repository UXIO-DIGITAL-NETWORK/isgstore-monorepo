import { CheckCircle2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/date";
import type { ComponentStatus, ServiceStatusComponent } from "../types/merchant.type";

import { useServiceStatus } from "../hooks/useMerchant";

const OVERALL_COPY: Record<ComponentStatus, { title: string; description: string; tone: string }> = {
  operational: {
    title: "Semua layanan normal",
    description: "Tidak ada gangguan yang sedang berlangsung.",
    tone: "text-success",
  },
  degraded: {
    title: "Ada layanan yang terganggu",
    description: "Sebagian metode pembayaran atau layanan sedang bermasalah atau ditutup sementara.",
    tone: "text-warning",
  },
  down: {
    title: "Ada layanan yang tidak dapat digunakan",
    description: "Sedang kami tangani. Rincian gangguan ada di bawah.",
    tone: "text-destructive",
  },
  // A single component can be `closed`, but the overall roll-up reports that as
  // `degraded`; this entry exists only so the map is total.
  closed: {
    title: "Ada layanan yang ditutup",
    description: "Sebagian layanan sedang dinonaktifkan.",
    tone: "text-warning",
  },
};

const STATUS_LABEL: Record<ComponentStatus, string> = {
  operational: "Normal",
  degraded: "Terganggu",
  down: "Tidak Tersedia",
  closed: "Ditutup",
};

const STATUS_TONE: Record<ComponentStatus, string> = {
  operational: "text-success",
  degraded: "text-warning",
  down: "text-destructive",
  closed: "text-muted-foreground",
};

const columns: Column<ServiceStatusComponent>[] = [
  {
    key: "name",
    header: "Komponen",
    cell: (r) => (
      <Text
        as="span"
        className="font-medium"
      >
        {r.name}
      </Text>
    ),
  },
  {
    key: "type",
    header: "Tipe",
    cell: (r) => (r.type === "payment_channel" ? "Metode Pembayaran" : "Service"),
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <Text
        as="span"
        className={cn("font-medium", STATUS_TONE[r.status])}
      >
        {STATUS_LABEL[r.status]}
      </Text>
    ),
  },
];

export default function MerchantServiceStatusPage() {
  const { data, isLoading, isError } = useServiceStatus();

  const overall = data?.overall ?? "operational";
  const copy = OVERALL_COPY[overall];

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Status Layanan</Heading>

      <Alert>
        <AlertTitle className={copy.tone}>{copy.title}</AlertTitle>
        <AlertDescription>{copy.description}</AlertDescription>
      </Alert>

      <Box className="flex flex-col gap-3">
        <Heading level={2}>Gangguan Berlangsung</Heading>

        {(data?.incidents.length ?? 0) === 0 ? (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>Semua layanan berjalan normal</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <Box className="flex flex-col gap-3">
            {data?.incidents.map((incident) => (
              <Box
                key={incident.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5"
              >
                <Box className="flex flex-wrap items-center gap-2">
                  <Heading level={3}>{incident.title}</Heading>
                  <StatusBadge status={incident.severity} />
                  <StatusBadge status={incident.status} />
                </Box>

                <Text variant="small">{incident.message}</Text>

                <Text
                  as="span"
                  variant="small"
                  className="text-muted-foreground"
                >
                  {incident.target.name ?? "Layanan"} · Mulai {formatDateTime(incident.started_at)}
                  {incident.estimated_resolved_at
                    ? ` · Estimasi selesai ${formatDateTime(incident.estimated_resolved_at)}`
                    : ""}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box className="flex flex-col gap-3">
        <Heading level={2}>Semua Komponen</Heading>
        <SimpleTable
          columns={columns}
          rows={data?.components ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyLabel="Belum ada komponen"
          rowKey={(r) => `${r.type}-${r.id}`}
        />
      </Box>
    </Box>
  );
}

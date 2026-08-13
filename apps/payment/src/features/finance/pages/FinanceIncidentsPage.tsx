import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/date";
import type { ServiceIncident } from "@/types/service.type";

import { IncidentFormDialog } from "../components/IncidentFormDialog";
import { useIncidents, useUpdateIncident } from "../hooks/useFinance";

export default function FinanceIncidentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useIncidents({ page, per_page: 20 });
  const { mutate: update, isPending } = useUpdateIncident();

  const columns: Column<ServiceIncident>[] = [
    {
      key: "title",
      header: "Judul",
      cell: (r) => (
        <Box className="flex flex-col">
          <Text
            as="span"
            className="font-medium"
          >
            {r.title}
          </Text>
          <Text
            as="span"
            variant="small"
            className="text-muted-foreground"
          >
            {r.message}
          </Text>
        </Box>
      ),
    },
    {
      key: "target",
      header: "Target",
      cell: (r) => r.target.name ?? "-",
    },
    { key: "severity", header: "Tingkat", cell: (r) => <StatusBadge status={r.severity} /> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "started", header: "Mulai", cell: (r) => formatDateTime(r.started_at) },
    { key: "estimated", header: "Estimasi Selesai", cell: (r) => formatDateTime(r.estimated_resolved_at) },
    {
      key: "actions",
      header: "Aksi",
      // Closing is the only edit worth a table button; the rest is rare enough
      // to warrant reopening the form.
      cell: (r) =>
        r.status === "RESOLVED" ? (
          <Text
            as="span"
            className="text-muted-foreground"
          >
            —
          </Text>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => update({ id: r.id, payload: { status: "RESOLVED" } })}
          >
            Tandai Selesai
          </Button>
        ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex items-center justify-between">
        <Heading level={1}>Status Layanan</Heading>
        <IncidentFormDialog />
      </Box>

      <Text
        variant="small"
        className="text-muted-foreground"
      >
        Insiden yang belum selesai tampil di halaman Status Layanan client. Metode pembayaran atau service yang
        dinonaktifkan otomatis tampil sebagai &ldquo;tutup&rdquo; tanpa perlu insiden.
      </Text>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada insiden"
        rowKey={(r) => r.id}
      />

      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </Box>
  );
}

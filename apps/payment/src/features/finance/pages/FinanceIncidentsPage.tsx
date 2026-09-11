import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("finance");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useIncidents({ page, per_page: 20 });
  const { mutate: update, isPending } = useUpdateIncident();

  const columns: Column<ServiceIncident>[] = [
    {
      key: "title",
      header: t("incidents.colTitle"),
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
      header: t("incidents.colTarget"),
      cell: (r) => r.target.name ?? "-",
    },
    { key: "severity", header: t("incidents.colSeverity"), cell: (r) => <StatusBadge status={r.severity} /> },
    { key: "status", header: t("incidents.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
    { key: "started", header: t("incidents.colStarted"), cell: (r) => formatDateTime(r.started_at) },
    { key: "estimated", header: t("incidents.colEstimated"), cell: (r) => formatDateTime(r.estimated_resolved_at) },
    {
      key: "actions",
      header: t("incidents.colAction"),
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
            {t("incidents.markResolved")}
          </Button>
        ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex items-center justify-between">
        <Heading level={1}>{t("incidents.title")}</Heading>
        <IncidentFormDialog />
      </Box>

      <Text
        variant="small"
        className="text-muted-foreground"
      >
        {t("incidents.note")}
      </Text>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("incidents.empty")}
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

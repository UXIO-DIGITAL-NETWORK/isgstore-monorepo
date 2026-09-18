import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

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

/**
 * Tone per overall status. The words themselves live in `merchant.json` —
 * only the colour is a code decision.
 */
const OVERALL_TONE: Record<ComponentStatus, string> = {
  operational: "text-success",
  degraded: "text-warning",
  down: "text-destructive",
  // A single component can be `closed`, but the overall roll-up reports that as
  // `degraded`; this entry exists only so the map is total.
  closed: "text-warning",
};

const STATUS_TONE: Record<ComponentStatus, string> = {
  operational: "text-success",
  degraded: "text-warning",
  down: "text-destructive",
  closed: "text-muted-foreground",
};

/**
 * A factory rather than a module constant: column headers and cell labels are
 * rendered text, so they have to resolve when the component renders.
 */
const columnsFor = (t: TFunction<"merchant">): Column<ServiceStatusComponent>[] => [
  {
    key: "name",
    header: t("serviceStatus.colComponent"),
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
    header: t("serviceStatus.colType"),
    cell: (r) => (r.type === "payment_channel" ? t("serviceStatus.typePaymentChannel") : t("serviceStatus.typeService")),
  },
  {
    key: "status",
    header: t("serviceStatus.colStatus"),
    cell: (r) => (
      <Text
        as="span"
        className={cn("font-medium", STATUS_TONE[r.status])}
      >
        {t(`serviceStatus.status.${r.status}`)}
      </Text>
    ),
  },
];

/**
 * The incident vocabulary, in the client's words.
 *
 * Mirrors the API's IncidentSeverity / IncidentStatus enums, whose own comments
 * are the definitions these labels follow — "MINOR: degraded but usable",
 * "IDENTIFIED: cause known, fix in progress" — so a client reads what it means
 * for them rather than the enum we store.
 */
const INCIDENT_SEVERITY: Record<string, string> = {
  MINOR: "serviceStatus.severity.minor",
  MAJOR: "serviceStatus.severity.major",
  CRITICAL: "serviceStatus.severity.critical",
};

const INCIDENT_STATUS: Record<string, string> = {
  INVESTIGATING: "serviceStatus.incidentStatus.investigating",
  IDENTIFIED: "serviceStatus.incidentStatus.identified",
  MONITORING: "serviceStatus.incidentStatus.monitoring",
  RESOLVED: "serviceStatus.incidentStatus.resolved",
};

export default function MerchantServiceStatusPage() {
  const { t } = useTranslation("merchant");
  const columns = columnsFor(t);
  const { data, isLoading, isError } = useServiceStatus();

  const overall = data?.overall ?? "operational";
  const tone = OVERALL_TONE[overall];

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("serviceStatus.title")}</Heading>

      <Alert>
        <AlertTitle className={tone}>{t(`serviceStatus.overall.${overall}.title`)}</AlertTitle>
        <AlertDescription>{t(`serviceStatus.overall.${overall}.description`)}</AlertDescription>
      </Alert>

      <Box className="flex flex-col gap-3">
        <Heading level={2}>{t("serviceStatus.ongoingIncidents")}</Heading>

        {(data?.incidents.length ?? 0) === 0 ? (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>{t("serviceStatus.allOperational")}</EmptyTitle>
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
                  <StatusBadge
                    status={incident.severity}
                    label={INCIDENT_SEVERITY[incident.severity] ? t(INCIDENT_SEVERITY[incident.severity]) : undefined}
                  />
                  <StatusBadge
                    status={incident.status}
                    label={INCIDENT_STATUS[incident.status] ? t(INCIDENT_STATUS[incident.status]) : undefined}
                  />
                </Box>

                <Text variant="small">{incident.message}</Text>

                <Text
                  as="span"
                  variant="small"
                  className="text-muted-foreground"
                >
                  {incident.target.name ?? t("serviceStatus.fallbackTargetName")} · {t("serviceStatus.incidentStarted")}{" "}
                  {formatDateTime(incident.started_at)}
                  {incident.estimated_resolved_at
                    ? ` · ${t("serviceStatus.estimatedResolved", { date: formatDateTime(incident.estimated_resolved_at) })}`
                    : ""}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box className="flex flex-col gap-3">
        <Heading level={2}>{t("serviceStatus.allComponents")}</Heading>
        <SimpleTable
          columns={columns}
          rows={data?.components ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyLabel={t("serviceStatus.empty")}
          rowKey={(r) => `${r.type}-${r.id}`}
        />
      </Box>
    </Box>
  );
}

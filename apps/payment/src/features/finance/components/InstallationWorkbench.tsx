import { useTranslation } from "react-i18next";
import { useState } from "react";

import { Box } from "@/components/common/Box";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Heading } from "@/components/common/Heading";
import { InstallationProgress } from "@/components/common/InstallationProgress";
import { SecretValue } from "@/components/common/SecretValue";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTime } from "@/utils/date";
import type {
  InstallationScope,
  ServiceInstallationDetail,
  ServiceInstallationStep,
} from "@/types/service.type";

import { DetailItemFormDialog } from "./DetailItemFormDialog";
import { InstallationWindowDialog } from "./InstallationWindowDialog";
import { StepFormDialog } from "./StepFormDialog";
import {
  useDeleteDetailItem,
  useDeleteStep,
  useFinanceInstallation,
  useRevealFinanceDetail,
  useSetStepCompletion,
} from "../hooks/useFinance";

interface InstallationWorkbenchProps {
  /**
   * Which id the installation is reached by. Both resolve to the same
   * (merchant, service) row on the server, so the invoice page and the
   * subscription page edit the same thing.
   */
  scope: InstallationScope;
}

/**
 * Everything kita does to an installation: the agreed window, the milestone
 * checklist, and the credentials handed over.
 *
 * Mounted from the invoice page (before confirmation, so the client's first
 * view of a paid service is a scheduled one) and from the subscription page
 * (afterwards). A host that also needs to inspect the installation just calls
 * `useFinanceInstallation(scope)` itself — the key is identical, so TanStack
 * dedupes it to one request rather than needing a callback prop.
 */
export function InstallationWorkbench({ scope }: InstallationWorkbenchProps) {
  const { t } = useTranslation("finance");
  const [pendingStep, setPendingStep] = useState<ServiceInstallationStep | null>(null);
  const [pendingDetail, setPendingDetail] = useState<ServiceInstallationDetail | null>(null);

  const { data: installation, isLoading } = useFinanceInstallation(scope);
  const { mutate: setCompletion } = useSetStepCompletion();
  const { mutate: deleteStep } = useDeleteStep();
  const { mutate: deleteDetail } = useDeleteDetailItem();
  const { mutateAsync: reveal } = useRevealFinanceDetail();

  const installationId = installation?.id;

  const stepColumns: Column<ServiceInstallationStep>[] = [
    {
      key: "done",
      header: t("workbench.colDone"),
      cell: (r) => (
        <Checkbox
          checked={r.is_completed}
          aria-label={`Tandai ${r.title}`}
          // Sends the desired state, not a flip, so two open tabs converge.
          onCheckedChange={(checked) => setCompletion({ id: r.id, completed: checked === true })}
        />
      ),
    },
    { key: "order", header: t("workbench.colOrder"), className: "tabular-nums", cell: (r) => r.sort_order },
    {
      key: "title",
      header: t("workbench.colStep"),
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
    { key: "completed_at", header: t("workbench.colCompletedAt"), cell: (r) => formatDateTime(r.completed_at) },
    {
      key: "actions",
      header: t("workbench.colAction"),
      cell: (r) => (
        <Box className="flex gap-2">
          <StepFormDialog
            installationId={installationId}
            step={r}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingStep(r)}
          >
            {t("workbench.delete")}
          </Button>
        </Box>
      ),
    },
  ];

  const detailColumns: Column<ServiceInstallationDetail>[] = [
    { key: "label", header: t("workbench.colLabel"), cell: (r) => r.label },
    {
      key: "value",
      header: t("workbench.colValue"),
      cell: (r) => (
        <SecretValue
          detail={r}
          reveal={reveal}
        />
      ),
    },
    {
      key: "secret",
      header: t("workbench.colSecret"),
      cell: (r) => (r.is_secret ? <Badge variant="secondary">{t("workbench.yes")}</Badge> : <Badge variant="outline">{t("workbench.no")}</Badge>),
    },
    {
      key: "actions",
      header: t("workbench.colAction"),
      cell: (r) => (
        <Box className="flex gap-2">
          <DetailItemFormDialog
            installationId={installationId}
            detail={r}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingDetail(r)}
          >
            {t("workbench.delete")}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between gap-2">
          <Heading level={2}>{t("workbench.schedule")}</Heading>
          <InstallationWindowDialog
            scope={scope}
            installation={installation}
          />
        </Box>
        <InstallationProgress
          installation={installation}
          isLoading={isLoading}
        />
      </Box>

      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between gap-2">
          <Heading level={2}>{t("workbench.steps")}</Heading>
          {/* Steps hang off the installation, so there is nothing to add to
              until the schedule has created it. */}
          <StepFormDialog installationId={installationId} />
        </Box>
        <SimpleTable
          columns={stepColumns}
          rows={installation?.steps ?? []}
          isLoading={isLoading}
          emptyLabel={t("noSteps")}
          rowKey={(r) => r.id}
        />
      </Box>

      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between gap-2">
          <Heading level={2}>{t("workbench.details")}</Heading>
          <DetailItemFormDialog installationId={installationId} />
        </Box>
        <SimpleTable
          columns={detailColumns}
          rows={installation?.details ?? []}
          isLoading={isLoading}
          emptyLabel={t("noDetails")}
          rowKey={(r) => r.id}
        />
      </Box>

      <DeleteConfirmDialog
        open={pendingStep !== null}
        onOpenChange={(next) => {
          if (!next) setPendingStep(null);
        }}
        title={t("workbench.deleteStepTitle")}
        description={pendingStep ? t("workbench.deleteStepDescription", { title: pendingStep.title }) : ""}
        confirmLabel={t("workbench.delete")}
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
        title={t("workbench.deleteDetailTitle")}
        description={
          pendingDetail ? t("workbench.deleteDetailDescription", { label: pendingDetail.label }) : ""
        }
        confirmLabel={t("workbench.delete")}
        onConfirm={() => {
          if (pendingDetail) deleteDetail(pendingDetail.id);
          setPendingDetail(null);
        }}
      />
    </>
  );
}

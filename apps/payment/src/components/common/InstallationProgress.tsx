import { CalendarClock, Check, Circle } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/utils/date";
import type { ServiceInstallation } from "@/types/service.type";

interface InstallationProgressProps {
  /** Null when kita has not scheduled anything yet. */
  installation: ServiceInstallation | null | undefined;
  isLoading?: boolean;
}

/**
 * Read-only view of an installation, shared by both roles: the agreed window,
 * how far along it is, and the checklist that the percentage is derived from —
 * shown together so the number is always accountable to the steps behind it.
 */
export function InstallationProgress({ installation, isLoading = false }: InstallationProgressProps) {
  if (isLoading) {
    return <Text variant="small">Memuat…</Text>;
  }

  if (!installation) {
    return (
      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarClock />
          </EmptyMedia>
          <EmptyTitle>Instalasi belum dijadwalkan</EmptyTitle>
          <EmptyDescription>Tim kami akan menjadwalkan pemasangan layanan ini.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { steps_total: total, steps_completed: done, progress_percent: percent } = installation;

  return (
    <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <Box className="flex flex-wrap items-baseline justify-between gap-2">
        <Heading level={3}>Progress Instalasi</Heading>
        <Text
          as="span"
          variant="small"
          className="tabular-nums text-muted-foreground"
        >
          {done}/{total} langkah · {percent}%
        </Text>
      </Box>

      <Progress value={percent} />

      {(installation.starts_at || installation.ends_at) && (
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          Rentang: {formatDate(installation.starts_at)} – {formatDate(installation.ends_at)}
        </Text>
      )}

      {installation.notes && <Text variant="small">{installation.notes}</Text>}

      {total === 0 ? (
        <Text
          variant="small"
          className="text-muted-foreground"
        >
          Tahapan instalasi belum disusun.
        </Text>
      ) : (
        <Box
          as="ul"
          className="flex flex-col gap-2"
        >
          {installation.steps.map((step) => (
            <Box
              as="li"
              key={step.id}
              className="flex items-start gap-2"
            >
              {step.is_completed ? (
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <Box className="flex flex-col">
                <Text
                  as="span"
                  variant="small"
                  className={cn(step.is_completed ? "text-foreground" : "text-muted-foreground")}
                >
                  {step.title}
                </Text>
                {step.is_completed && (
                  <Text
                    as="span"
                    variant="small"
                    className="text-muted-foreground"
                  >
                    {formatDateTime(step.completed_at)}
                    {step.completed_by ? ` · ${step.completed_by}` : ""}
                  </Text>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

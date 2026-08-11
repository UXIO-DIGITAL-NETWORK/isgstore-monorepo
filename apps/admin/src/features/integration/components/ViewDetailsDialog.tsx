import { RefreshCw } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/currency";
import { useChannelDetails, usePingChannel } from "../hooks/useIntegration";
import type { IntegrationChannelField } from "../types/integration.type";

interface ViewDetailsDialogProps {
  provider: string;
  channelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box className="flex items-start justify-between gap-4 py-1.5">
      <Text
        as="span"
        variant="muted"
        className="text-sm"
      >
        {label}
      </Text>
      <Text
        as="span"
        className="text-right text-sm text-foreground tabular-nums"
      >
        {children}
      </Text>
    </Box>
  );
}

const fieldValue = (field: IntegrationChannelField): string => {
  if (field.type === "boolean") return field.value ? "Yes" : "No";
  if (field.value === null || field.value === "") return "Not set";
  return String(field.value);
};

export function ViewDetailsDialog({ provider, channelName, open, onOpenChange }: ViewDetailsDialogProps) {
  const { data: details, isLoading } = useChannelDetails(open ? provider : undefined);
  const pingChannel = usePingChannel();

  const isConnected = details?.connection_status === "connected";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{`${channelName} details`}</DialogTitle>
          <DialogDescription>Connection status, balance, and (masked) credentials.</DialogDescription>
        </DialogHeader>

        {isLoading || !details ? (
          <Text variant="muted">Loading…</Text>
        ) : (
          <Box className="flex flex-col gap-4">
            <Box className="flex flex-col divide-y divide-border">
              <Row label="Status">
                <Badge
                  variant="outline"
                  className={
                    isConnected
                      ? "border-success/20 bg-success/10 text-success"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  }
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </Row>
              <Row label="Balance">
                {details.balance !== null ? formatCurrency(details.balance, { fractionDigits: 0 }) : "—"}
              </Row>
              <Row label="Mode">{details.mode ?? "—"}</Row>
              <Row label="Endpoint">{details.endpoint ?? "—"}</Row>
            </Box>

            <Box className="flex flex-col gap-1">
              <Text
                as="span"
                variant="muted"
                className="text-xs font-medium uppercase tracking-wide"
              >
                Credentials
              </Text>
              <Box className="flex flex-col divide-y divide-border">
                {details.fields.map((field) => (
                  <Row
                    key={field.key}
                    label={field.label}
                  >
                    {fieldValue(field)}
                  </Row>
                ))}
              </Box>
            </Box>

            <Box className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={pingChannel.isPending}
                onClick={() => pingChannel.mutate(provider)}
              >
                <RefreshCw className="size-4" />
                {pingChannel.isPending ? "Pinging…" : "Ping now"}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

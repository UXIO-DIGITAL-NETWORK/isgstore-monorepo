import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { integrationService } from "../services/integration.service";
import type { UpdateChannelPayload } from "../types/integration.type";

// Connectivity is never "terminal" the way a transaction status is — a
// channel keeps needing pings indefinitely — so this polls on a fixed
// interval with no stop condition, per system_architecture.md §4.9.
// Aligned to the backend's 60s balance cache: polling faster than that just
// re-serves the same cached numbers while adding request load.
const CHANNEL_POLL_INTERVAL_MS = 60_000;

export const useChannels = () =>
  useQuery({
    queryKey: ["integration", "channels"],
    queryFn: integrationService.getChannels,
    refetchInterval: CHANNEL_POLL_INTERVAL_MS,
  });

export const useChannelDetails = (provider: string | undefined) =>
  useQuery({
    queryKey: ["integration", "channel", provider],
    queryFn: () => integrationService.getChannelDetails(provider as string),
    enabled: Boolean(provider),
  });

export const usePingChannel = () => {
  const { t } = useTranslation("integration");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => integrationService.pingChannel(provider),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ["integration", "channels"] });
      toast.success(
        channel.connection_status === "connected"
          ? `${channel.name} is connected`
          : `${channel.name} is still disconnected`,
      );
    },
    onError: () => toast.error(t("refreshFailed")),
  });
};

export const useUpdateChannel = () => {
  const { t } = useTranslation("integration");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, payload }: { provider: string; payload: UpdateChannelPayload }) =>
      integrationService.updateChannel(provider, payload),
    onSuccess: (details) => {
      queryClient.invalidateQueries({ queryKey: ["integration", "channels"] });
      queryClient.invalidateQueries({ queryKey: ["integration", "channel", details.provider] });
      toast.success(t("connectionUpdated"));
    },
    onError: () => toast.error(t("connectionUpdateFailed")),
  });
};

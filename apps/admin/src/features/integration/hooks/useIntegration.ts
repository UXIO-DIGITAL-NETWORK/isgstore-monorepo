import { useQuery } from "@tanstack/react-query";
import { integrationService } from "../services/integration.service";

// Connectivity is never "terminal" the way a transaction status is — a
// channel keeps needing pings indefinitely — so this polls on a fixed
// interval with no stop condition, per system_architecture.md §4.9.
const CHANNEL_POLL_INTERVAL_MS = 30_000;

export const useChannels = () =>
  useQuery({
    queryKey: ["integration", "channels"],
    queryFn: integrationService.getChannels,
    refetchInterval: CHANNEL_POLL_INTERVAL_MS,
  });

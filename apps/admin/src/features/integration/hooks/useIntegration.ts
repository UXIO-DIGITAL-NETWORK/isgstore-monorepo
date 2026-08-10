import { useQuery } from "@tanstack/react-query";
import { integrationService } from "../services/integration.service";

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

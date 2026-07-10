import { CHANNELS } from "../data/channels.data";
import type { IntegrationChannel } from "../types/integration.type";

// Mock-backed for now (backend not built yet). Swap the method body to a
// real `api.get(...)` call once the backend ships — hooks/UI stay unchanged.
// See system_architecture.md §6.
export const integrationService = {
  getChannels: async (): Promise<IntegrationChannel[]> => CHANNELS,
};

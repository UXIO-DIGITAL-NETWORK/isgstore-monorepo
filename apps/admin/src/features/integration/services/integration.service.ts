import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type {
  IntegrationChannel,
  IntegrationChannelDetails,
  UpdateChannelPayload,
} from "../types/integration.type";

interface IntegrationChannelApiRow {
  id: string;
  provider?: string;
  type: IntegrationChannel["type"];
  name: string;
  connection_status: IntegrationChannel["connection_status"];
  balance: number | null;
  mode?: string | null;
  last_ping_at: string;
}

/**
 * The API composes this from the same balance probes Financial uses — a
 * successful read means the channel is reachable. It reports only channels
 * with a real backend integration, so `whatsapp_gateway` / `email_gateway`
 * never arrive; the union keeps them because the cards are ready for them.
 *
 * `created_at`/`updated_at` are not in the response either. They are optional
 * on the type and unread by the UI, so `last_ping_at` stands in rather than
 * inventing timestamps.
 */
const toChannel = (row: IntegrationChannelApiRow): IntegrationChannel => ({
  id: row.id,
  provider: row.provider ?? row.id,
  type: row.type,
  name: row.name,
  connection_status: row.connection_status,
  balance: row.balance ?? undefined,
  mode: row.mode ?? undefined,
  last_ping_at: row.last_ping_at,
  created_at: row.last_ping_at,
  updated_at: row.last_ping_at,
});

export const integrationService = {
  getChannels: async (): Promise<IntegrationChannel[]> => {
    const response: ApiResponse<IntegrationChannelApiRow[]> = await api.get(`${API_VERSION}/integration/channels`);
    return response.data.map(toChannel);
  },

  /** Detail view incl. the masked credential field schema for the edit form. */
  getChannelDetails: async (provider: string): Promise<IntegrationChannelDetails> => {
    const response: ApiResponse<IntegrationChannelDetails> = await api.get(
      `${API_VERSION}/integration/channels/${provider}`,
    );
    return response.data;
  },

  /** Save edited credentials; blank secrets are kept server-side (write-only). */
  updateChannel: async (provider: string, payload: UpdateChannelPayload): Promise<IntegrationChannelDetails> => {
    const response: ApiResponse<IntegrationChannelDetails> = await api.put(
      `${API_VERSION}/integration/channels/${provider}`,
      payload,
    );
    return response.data;
  },

  /** Force a fresh status/balance read (busts the 60s cache server-side). */
  pingChannel: async (provider: string): Promise<IntegrationChannel> => {
    const response: ApiResponse<IntegrationChannelApiRow> = await api.post(
      `${API_VERSION}/integration/channels/${provider}/ping`,
    );
    return toChannel(response.data);
  },
};

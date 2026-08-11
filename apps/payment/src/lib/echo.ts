import Echo from "laravel-echo";
import Pusher, { type ChannelAuthorizationCallback } from "pusher-js";
import axios from "axios";
import { ENV } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Laravel Echo client (Reverb — Pusher wire protocol).
 *
 * Realtime is an enhancement: if credentials are absent, `echo` is `null` and
 * consumers fall back to TanStack Query polling, so the app works before
 * `VITE_REVERB_*` is provisioned.
 *
 * Private channels authorise against our Sanctum-guarded `/api/broadcasting/auth`.
 * A bare axios call (not the app's `api` instance) is used on purpose: `api`'s
 * interceptor unwraps the envelope, but pusher-js needs the raw `{ auth: ... }`
 * body. The bearer token is read at authorize time so rotations are respected.
 */

// laravel-echo's reverb connector reads Pusher off the global.
(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

function createEcho(): Echo<"reverb"> | null {
  if (!ENV.REVERB_APP_KEY) {
    console.warn("[echo] VITE_REVERB_APP_KEY is empty — realtime disabled, using polling fallback.");
    return null;
  }

  return new Echo<"reverb">({
    broadcaster: "reverb",
    key: ENV.REVERB_APP_KEY,
    wsHost: ENV.REVERB_HOST,
    wsPort: ENV.REVERB_PORT,
    wssPort: ENV.REVERB_PORT,
    forceTLS: ENV.REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
        const token = useAuthStore.getState().token;
        axios
          .post(
            `${ENV.API_BASE_URL}/broadcasting/auth`,
            { socket_id: socketId, channel_name: channel.name },
            {
              headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          )
          .then((res) => callback(null, res.data))
          .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
      },
    }),
  });
}

export const echo = createEcho();

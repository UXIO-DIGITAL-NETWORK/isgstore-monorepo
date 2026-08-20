import Echo from "laravel-echo";
import Pusher, { type ChannelAuthorizationCallback } from "pusher-js";
import axios from "axios";
import { ENV } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Laravel Echo client (hosted Pusher — pusher.com).
 *
 * Realtime is an *enhancement*: if credentials are absent, `echo` is `null` and
 * consumers fall back to TanStack Query polling, so the app works before
 * `VITE_PUSHER_*` is provisioned.
 *
 * Private channels authorise against our Sanctum-guarded `/api/broadcasting/auth`.
 * A bare axios call (not the app's `api` instance) is used on purpose: `api`'s
 * interceptor unwraps the envelope, but pusher-js needs the raw `{ auth: ... }`
 * body. The bearer token is read at authorize time so rotations are respected.
 */

// laravel-echo's pusher connector reads Pusher off the global.
(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

/**
 * Why realtime can't run, or null if it can. Hosted Pusher needs only an app key
 * and a cluster — there is no local WebSocket host to point at.
 */
function realtimeDisabledReason(): string | null {
  if (!ENV.PUSHER_APP_KEY) {
    return "VITE_PUSHER_APP_KEY is empty";
  }
  if (!ENV.PUSHER_APP_CLUSTER) {
    return "VITE_PUSHER_APP_CLUSTER is empty";
  }
  return null;
}

function createEcho(): Echo<"pusher"> | null {
  const disabledReason = realtimeDisabledReason();
  if (disabledReason) {
    console.warn(`[echo] realtime disabled (${disabledReason}); using polling fallback.`);
    return null;
  }

  return new Echo<"pusher">({
    broadcaster: "pusher",
    key: ENV.PUSHER_APP_KEY,
    cluster: ENV.PUSHER_APP_CLUSTER,
    forceTLS: true,
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

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

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];

/**
 * Why realtime can't run, or null if it can. Guarding here (rather than letting
 * pusher-js dial an unusable host) stops the endless failed-reconnect loop that
 * floods the console when the WebSocket host is unset or still points at
 * localhost on a deployed origin.
 */
function realtimeDisabledReason(): string | null {
  if (!ENV.REVERB_APP_KEY) {
    return "VITE_REVERB_APP_KEY is empty";
  }
  if (!ENV.REVERB_HOST) {
    return "VITE_REVERB_HOST is empty";
  }

  const pageHost = typeof window !== "undefined" ? window.location.hostname : "";
  const hostIsLoopback = LOOPBACK_HOSTS.includes(ENV.REVERB_HOST);
  const pageIsLoopback = LOOPBACK_HOSTS.includes(pageHost);

  if (hostIsLoopback && pageHost && !pageIsLoopback) {
    return `VITE_REVERB_HOST is "${ENV.REVERB_HOST}" but the app is served from "${pageHost}" — set VITE_REVERB_* to the deployed WebSocket host`;
  }

  return null;
}

function createEcho(): Echo<"reverb"> | null {
  const disabledReason = realtimeDisabledReason();
  if (disabledReason) {
    console.warn(`[echo] realtime disabled (${disabledReason}); using polling fallback.`);
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

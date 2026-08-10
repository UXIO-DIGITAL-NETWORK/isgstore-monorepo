import { useEffect, useState } from "react";
import { echo } from "@/lib/echo";

/**
 * Tracks whether the Reverb/Pusher WebSocket is currently connected.
 *
 * Used to gate polling: when realtime is healthy, queries can stop (or heavily
 * slow) their `refetchInterval` and rely on push; when the socket drops, callers
 * fall back to polling. Returns `false` when Echo is unconfigured (`echo` null),
 * so the polling fallback stays on until credentials are provisioned.
 */
export function useEchoConnected(): boolean {
  const connection = echo?.connector?.pusher?.connection;
  const [connected, setConnected] = useState<boolean>(connection?.state === "connected");

  useEffect(() => {
    if (!connection) return;

    const update = () => setConnected(connection.state === "connected");
    connection.bind("state_change", update);
    update();

    return () => {
      connection.unbind("state_change", update);
    };
  }, [connection]);

  return connected;
}

import { useState, useEffect, useMemo } from "react";

/**
 * Counts down from `durationSeconds` to zero.
 * Returns zero-padded string values for hours, minutes, and seconds.
 */
export function useCountdown(durationSeconds: number) {
  const [endTime] = useState(() => Date.now() + durationSeconds * 1000);

  return useCountdownTo(endTime);
}

/**
 * Counts down to an absolute instant.
 *
 * Preferred over `useCountdown` wherever the deadline is set by the server: an
 * elapsed-duration timer restarts at full on every remount, which would tell a
 * customer who refreshed the page that they have far more time to pay than the
 * backend will actually allow.
 *
 * `target` may be an ISO string, an epoch, or null (nothing to count down to).
 */
export function useCountdownTo(target: string | number | null | undefined) {
  const endTime = useMemo(() => {
    if (target === null || target === undefined) return null;
    const parsed = typeof target === "number" ? target : Date.parse(target);
    return Number.isNaN(parsed) ? null : parsed;
  }, [target]);

  // The clock is the state; the remaining time is derived from it. Storing the
  // remainder instead would leave a stale value on screen for up to a second
  // whenever `target` changes, and would mean resetting state from an effect.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endTime === null) return;

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const remaining = endTime === null ? 0 : Math.max(0, Math.round((endTime - now) / 1000));

  return {
    hours: String(Math.floor(remaining / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((remaining % 3600) / 60)).padStart(2, "0"),
    seconds: String(remaining % 60).padStart(2, "0"),
    totalSeconds: remaining,
    isExpired: endTime !== null && remaining === 0,
  };
}

import { useState, useEffect } from "react";

/**
 * Counts down from `durationSeconds` to zero.
 * Returns zero-padded string values for hours, minutes, and seconds.
 */
export function useCountdown(durationSeconds: number) {
  const [endTime] = useState(() => Date.now() + durationSeconds * 1000);
  const [remaining, setRemaining] = useState<number>(durationSeconds);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return {
    hours: String(Math.floor(remaining / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((remaining % 3600) / 60)).padStart(2, "0"),
    seconds: String(remaining % 60).padStart(2, "0"),
  };
}

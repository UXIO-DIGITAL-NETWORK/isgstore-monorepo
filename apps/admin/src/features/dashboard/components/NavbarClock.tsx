import { useEffect, useState } from "react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PLATFORM_TIMEZONE_LABEL, formatWib } from "@/utils/date";

/**
 * Live wall clock for the panel — always WIB.
 *
 * The platform runs on one wall clock, which is also the zone the API buckets
 * every report window in, so the time on screen and the numbers beside it refer
 * to the same day. It deliberately does not read `users.timezone` (a value a
 * foreign browser used to be able to move) nor the browser's own zone.
 *
 * Kept as its own leaf, subscribed to a narrow selector: a per-second
 * setInterval inside DashboardNavbar would re-render the breadcrumb trail and
 * the user dropdown once a second for as long as the panel is open.
 */
export function NavbarClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Align the first tick to the next whole second, or the display visibly
    // stutters (two changes ~1ms apart, then a long gap).
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), 1000);
      },
      1000 - (Date.now() % 1000),
    );

    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <Box
      className="hidden items-center rounded-md px-2 py-1 md:flex"
      title={PLATFORM_TIMEZONE_LABEL}
    >
      <Text
        as="span"
        className="text-sm font-medium tabular-nums text-muted-foreground"
      >
        {formatWib(now, "HH:mm:ss")} {PLATFORM_TIMEZONE_LABEL}
      </Text>
    </Box>
  );
}

import { useEffect, useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Live wall clock for the signed-in admin's timezone.
 *
 * It renders `users.timezone` — the stored value the API also computes every
 * report window from — never the browser's own zone. That is what guarantees
 * the time on screen and the numbers in the reports refer to the same day.
 *
 * Kept as its own leaf, subscribed to a narrow selector: a per-second
 * setInterval inside DashboardNavbar would re-render the breadcrumb trail and
 * the user dropdown once a second for as long as the panel is open.
 */
export function NavbarClock() {
  const timezone = useAuthStore((state) => state.user?.timezone);
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

  const formatter = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    };
    try {
      // `users.timezone` is only validated on login and on the sync endpoint,
      // so a value edited through the users CRUD can be unparseable here.
      return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: timezone || "UTC" });
    } catch {
      return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" });
    }
  }, [timezone]);

  if (!timezone) return null;

  return (
    <Box
      className="hidden items-center rounded-md px-2 py-1 md:flex"
      title={timezone}
    >
      <Text
        as="span"
        className="text-sm font-medium tabular-nums text-muted-foreground"
      >
        {formatter.format(now)}
      </Text>
    </Box>
  );
}

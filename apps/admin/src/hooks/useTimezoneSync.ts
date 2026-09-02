import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getBrowserTimezone } from "@/utils/getBrowserTimezone";

/**
 * Module-level rather than a ref: a failed PATCH must not be retried on every
 * navigation, and the guard has to outlive the component that mounts the hook.
 */
let attempted = false;

/** Test seam — the admin layout never resets this. */
export function resetTimezoneSync() {
  attempted = false;
}

/**
 * Keeps `users.timezone` in step with where the admin actually is.
 *
 * The stored value — not the browser's — drives both the navbar clock and
 * every report window, so the two can never disagree. That only holds if the
 * stored value is kept fresh, and the panel had no code path that did.
 *
 * On failure this deliberately does nothing: the clock and the reports both
 * stay on the old zone, which is still self-consistent. Falling back to the
 * browser zone in the clock alone is what would break the invariant.
 */
export function useTimezoneSync() {
  const token = useAuthStore((state) => state.token);
  const timezone = useAuthStore((state) => state.user?.timezone);
  const patchUser = useAuthStore((state) => state.patchUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (attempted || !token || !timezone) return;

    const browserTimezone = getBrowserTimezone();
    if (!browserTimezone || browserTimezone === timezone) return;

    attempted = true;
    void authService
      .syncTimezone(browserTimezone)
      .then(() => {
        patchUser({ timezone: browserTimezone });
        // Without this the admin reads figures bucketed in the old zone while
        // the clock already shows the new one — the exact disagreement this
        // whole mechanism exists to prevent.
        void queryClient.invalidateQueries({ queryKey: ["reports"] });
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        void queryClient.invalidateQueries({ queryKey: ["financial"] });
      })
      .catch(() => {
        // Intentionally silent — see the docblock.
      });
  }, [token, timezone, patchUser, queryClient]);
}

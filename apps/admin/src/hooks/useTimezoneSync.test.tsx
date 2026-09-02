import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { authService } from "@/features/auth/services/auth.service";
import { makeUser } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import * as browserTimezone from "@/utils/getBrowserTimezone";
import { resetTimezoneSync, useTimezoneSync } from "./useTimezoneSync";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  resetTimezoneSync();
  useAuthStore.setState({ token: "test-token", user: makeUser({ timezone: "Asia/Jakarta" }) });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
  vi.restoreAllMocks();
});

describe("useTimezoneSync", () => {
  it("pushes the browser timezone when it differs from the stored one", async () => {
    vi.spyOn(browserTimezone, "getBrowserTimezone").mockReturnValue("Europe/Berlin");
    const spy = vi.spyOn(authService, "syncTimezone").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: { timezone: "Europe/Berlin" },
    });

    renderHook(() => useTimezoneSync(), { wrapper });

    await waitFor(() => expect(spy).toHaveBeenCalledWith("Europe/Berlin"));
    // The store must be updated too, or a full reload re-fires this forever.
    await waitFor(() => expect(useAuthStore.getState().user?.timezone).toBe("Europe/Berlin"));
  });

  it("does nothing when the stored timezone already matches", () => {
    vi.spyOn(browserTimezone, "getBrowserTimezone").mockReturnValue("Asia/Jakarta");
    const spy = vi.spyOn(authService, "syncTimezone");

    renderHook(() => useTimezoneSync(), { wrapper });

    expect(spy).not.toHaveBeenCalled();
  });

  it("leaves the stored timezone alone when the sync fails, and does not retry", async () => {
    vi.spyOn(browserTimezone, "getBrowserTimezone").mockReturnValue("Europe/Berlin");
    const spy = vi.spyOn(authService, "syncTimezone").mockRejectedValue(new Error("network"));

    const { unmount } = renderHook(() => useTimezoneSync(), { wrapper });
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    unmount();

    // Remounting on the next navigation must not fire it again.
    renderHook(() => useTimezoneSync(), { wrapper });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.timezone).toBe("Asia/Jakarta");
  });
});

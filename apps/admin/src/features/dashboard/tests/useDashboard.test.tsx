import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useStatCards } from "../hooks/useDashboard";
import { STAT_CARDS } from "../data/stat-cards.data";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useStatCards", () => {
  it("resolves the stat-cards fixture via TanStack Query", async () => {
    const { result } = renderHook(() => useStatCards(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(STAT_CARDS);
  });
});

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

    // Ids now come from the API's stable card keys (`todays_sales`), not the
    // fixture's slug (`todays-sales`) — the labels and figures are what the
    // cards render and what this hook is responsible for.
    expect(result.current.data?.map((card) => card.label)).toEqual(STAT_CARDS.map((card) => card.label));
    expect(result.current.data?.map((card) => card.value)).toEqual(STAT_CARDS.map((card) => card.value));
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import MerchantServiceStatusPage from "../pages/MerchantServiceStatusPage";
import * as hooks from "../hooks/useMerchant";
import type { ServiceStatusResponse } from "../types/merchant.type";

const mockStatus = (data: ServiceStatusResponse) =>
  vi.spyOn(hooks, "useServiceStatus").mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useServiceStatus>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantServiceStatusPage />
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());

describe("MerchantServiceStatusPage", () => {
  it("shows an open incident with its target and severity", () => {
    mockStatus({
      overall: "degraded",
      incidents: [
        {
          id: 2,
          title: "QRIS lambat",
          target: { type: "payment_channel", id: 3, name: "QRIS" },
          severity: "MAJOR",
          status: "INVESTIGATING",
          message: "Settlement tertunda dari sisi provider.",
          started_at: "2026-08-14T09:00:00+07:00",
          estimated_resolved_at: "2026-08-14T12:00:00+07:00",
        },
      ],
      components: [
        { type: "payment_channel", id: 3, name: "QRIS", status: "degraded" },
        { type: "payment_channel", id: 5, name: "BNI VA", status: "closed" },
      ],
    });

    renderPage();

    expect(screen.getByText("Ada layanan yang terganggu")).toBeInTheDocument();
    expect(screen.getByText("QRIS lambat")).toBeInTheDocument();
    expect(screen.getByText("MAJOR")).toBeInTheDocument();
    // A channel switched off in configuration reads as closed, not as a fault.
    expect(screen.getByText("Ditutup")).toBeInTheDocument();
  });

  it("shows the all-clear when nothing is open", () => {
    mockStatus({
      overall: "operational",
      incidents: [],
      components: [{ type: "service", id: 1, name: "Digiflazz", status: "operational" }],
    });

    renderPage();

    expect(screen.getByText("Semua layanan normal")).toBeInTheDocument();
    expect(screen.getByText("Semua layanan berjalan normal")).toBeInTheDocument();
  });
});

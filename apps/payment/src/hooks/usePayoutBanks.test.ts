import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { envelope } from "@/test/apiEnvelope";
import { usePayoutBanks, isEwalletCode, bankLabel, type PayoutBank } from "./usePayoutBanks";

const BANKS: PayoutBank[] = [
  { code: "BCA", name: "Bank Central Asia (BCA)", is_ewallet: false },
  { code: "DANA", name: "DANA", is_ewallet: true },
];

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePayoutBanks", () => {
  it("reads the catalogue from the API instead of a bundled copy", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope(BANKS));

    const { result } = renderHook(() => usePayoutBanks(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(BANKS));
    expect(api.get).toHaveBeenCalledWith(`${API_VERSION}/payout-banks`);
  });

  it("yields an empty list rather than undefined when the endpoint sends no data", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope(null));

    const { result } = renderHook(() => usePayoutBanks(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("degrades to an empty list when the body is not a list at all", async () => {
    // Every consumer maps over this. An object body must leave the picker
    // empty, not throw inside a withdrawal form.
    vi.mocked(api.get).mockResolvedValueOnce(envelope({} as unknown as PayoutBank[]));

    const { result } = renderHook(() => usePayoutBanks(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("isEwalletCode", () => {
  it("reads the flag off the fetched row, not a hardcoded code list", () => {
    expect(isEwalletCode(BANKS, "DANA")).toBe(true);
    expect(isEwalletCode(BANKS, "BCA")).toBe(false);
  });

  it("treats an unknown or missing code as a bank transfer", () => {
    // The safe default: a bank asks for an account number, and requiring one
    // too often is recoverable — skipping it sends money nowhere.
    expect(isEwalletCode(BANKS, "NOT_A_BANK")).toBe(false);
    expect(isEwalletCode(BANKS, undefined)).toBe(false);
    expect(isEwalletCode([], "DANA")).toBe(false);
  });
});

describe("bankLabel", () => {
  it("renders code and name the way the picker lists them", () => {
    expect(bankLabel(BANKS[0])).toBe("BCA — Bank Central Asia (BCA)");
  });

  it("falls back to the code when the API sends no name", () => {
    expect(bankLabel({ code: "BCA", name: null, is_ewallet: false })).toBe("BCA");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { paginated } from "@/test/apiEnvelope";
import { feedbackService } from "../services/feedback.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const memberRow = {
  id: 7,
  transaction_id: 3,
  user_id: 12,
  guest_name: null,
  rating: 5,
  comment: "Mantap",
  user: { id: 12, name: "Budi", username: "budi88" },
  transaction: { id: 3, invoice_number: "INV-20260807-ABC123", product: { name: "ML 100 Diamond" } },
  created_at: "2026-08-07T10:00:00.000Z",
};

const guestRow = {
  id: 8,
  transaction_id: 4,
  user_id: null,
  guest_name: "Guest K48213",
  rating: 4,
  comment: null,
  user: null,
  transaction: { id: 4, invoice_number: "INV-20260807-XYZ999", product: { name: "FF 70 Diamond" } },
  created_at: "2026-08-07T11:00:00.000Z",
};

beforeEach(() => vi.clearAllMocks());

describe("feedbackService.list", () => {
  it("forwards pagination params to the ratings endpoint", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await feedbackService.list({ page: 2, per_page: 20 });

    expect(api.get).toHaveBeenCalledWith("/v1/ratings", { params: { page: 2, per_page: 20 } });
  });

  it("maps a member rating to the reviewer's name", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([memberRow]));

    const [row] = (await feedbackService.list()).data;

    expect(row).toEqual({
      id: "7",
      rating: 5,
      comment: "Mantap",
      reviewer: "Budi",
      isGuest: false,
      product: "ML 100 Diamond",
      invoiceNumber: "INV-20260807-ABC123",
      createdAt: "2026-08-07T10:00:00.000Z",
    });
  });

  it("maps a guest rating to its generated name and flags it as a guest", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([guestRow]));

    const [row] = (await feedbackService.list()).data;

    expect(row).toMatchObject({
      id: "8",
      reviewer: "Guest K48213",
      isGuest: true,
      comment: null,
      product: "FF 70 Diamond",
    });
  });
});

describe("feedbackService.remove", () => {
  it("deletes the rating by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);

    await feedbackService.remove("7");

    expect(api.delete).toHaveBeenCalledWith("/v1/ratings/7");
  });
});

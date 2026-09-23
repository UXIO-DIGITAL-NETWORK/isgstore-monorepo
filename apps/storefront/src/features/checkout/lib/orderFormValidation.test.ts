import { describe, it, expect } from "vitest";

import { getOrderFormErrors } from "@/features/checkout/lib/orderFormValidation";
import type { OrderFormField } from "@/types/models/game.model";

const field = (over: Partial<OrderFormField> = {}): OrderFormField => ({
  key: "user_id",
  label: "User ID",
  type: "number",
  required: true,
  min_length: null,
  max_length: null,
  pattern: null,
  options: [],
  placeholder: null,
  help: null,
  ...over,
});

describe("getOrderFormErrors", () => {
  it("flags a required field left empty", () => {
    expect(getOrderFormErrors([field()], { user_id: " " })).toEqual({
      user_id: { key: "accountDetail.errors.required" },
    });
  });

  it("skips every rule for an empty optional field", () => {
    expect(getOrderFormErrors([field({ required: false, min_length: 4 })], { user_id: "" })).toEqual({
      user_id: null,
    });
  });

  it("rejects non-digits in a number field", () => {
    expect(getOrderFormErrors([field()], { user_id: "12ab" })).toEqual({
      user_id: { key: "accountDetail.errors.numeric" },
    });
  });

  it("keeps leading zeros valid — some supplier ids carry them", () => {
    expect(getOrderFormErrors([field()], { user_id: "0012345" })).toEqual({ user_id: null });
  });

  it("reports the declared bound with the length errors", () => {
    expect(getOrderFormErrors([field({ min_length: 6 })], { user_id: "123" })).toEqual({
      user_id: { key: "accountDetail.errors.minLength", values: { length: 6 } },
    });
    expect(getOrderFormErrors([field({ max_length: 4 })], { user_id: "123456" })).toEqual({
      user_id: { key: "accountDetail.errors.maxLength", values: { length: 4 } },
    });
  });

  it("applies a declared pattern", () => {
    const zone = field({ key: "zone_id", type: "text", pattern: "^[0-9]{4}$" });

    expect(getOrderFormErrors([zone], { zone_id: "2027" })).toEqual({ zone_id: null });
    expect(getOrderFormErrors([zone], { zone_id: "20" })).toEqual({
      zone_id: { key: "accountDetail.errors.pattern" },
    });
  });

  it("ignores a malformed admin-entered pattern instead of failing a valid id", () => {
    expect(getOrderFormErrors([field({ type: "text", pattern: "([" })], { user_id: "63193868" })).toEqual({
      user_id: null,
    });
  });

  it("reports each identifier under its own key, however many the game declares", () => {
    const fields = [
      field(),
      field({ key: "zone_id", label: "Zone ID" }),
      field({ key: "role_id", label: "Role", required: false }),
    ];

    expect(getOrderFormErrors(fields, { user_id: "63193868", zone_id: "", role_id: "7" })).toEqual({
      user_id: null,
      zone_id: { key: "accountDetail.errors.required" },
      role_id: null,
    });
  });
});

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
    expect(getOrderFormErrors([field()], [" "])).toEqual([{ key: "accountDetail.errors.required" }]);
  });

  it("skips every rule for an empty optional field", () => {
    expect(getOrderFormErrors([field({ required: false, min_length: 4 })], [""])).toEqual([null]);
  });

  it("rejects non-digits in a number field", () => {
    expect(getOrderFormErrors([field()], ["12ab"])).toEqual([{ key: "accountDetail.errors.numeric" }]);
  });

  it("keeps leading zeros valid — some supplier ids carry them", () => {
    expect(getOrderFormErrors([field()], ["0012345"])).toEqual([null]);
  });

  it("reports the declared bound with the length errors", () => {
    expect(getOrderFormErrors([field({ min_length: 6 })], ["123"])).toEqual([
      { key: "accountDetail.errors.minLength", values: { length: 6 } },
    ]);
    expect(getOrderFormErrors([field({ max_length: 4 })], ["123456"])).toEqual([
      { key: "accountDetail.errors.maxLength", values: { length: 4 } },
    ]);
  });

  it("applies a declared pattern", () => {
    const zone = field({ type: "text", pattern: "^[0-9]{4}$" });

    expect(getOrderFormErrors([zone], ["2027"])).toEqual([null]);
    expect(getOrderFormErrors([zone], ["20"])).toEqual([{ key: "accountDetail.errors.pattern" }]);
  });

  it("ignores a malformed admin-entered pattern instead of failing a valid id", () => {
    expect(getOrderFormErrors([field({ type: "text", pattern: "([" })], ["63193868"])).toEqual([null]);
  });

  it("stays index-aligned across both fields", () => {
    const fields = [field(), field({ key: "zone_id", label: "Zone ID" })];

    expect(getOrderFormErrors(fields, ["63193868", ""])).toEqual([
      null,
      { key: "accountDetail.errors.required" },
    ]);
  });
});

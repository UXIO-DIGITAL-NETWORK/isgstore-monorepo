import { describe, it, expect } from "vitest";

import { getApiErrorMessage } from "./apiError";

describe("getApiErrorMessage", () => {
  it("prefers the API's own message over the axios status text", () => {
    const error = {
      message: "Request failed with status code 422",
      response: { data: { message: "The selected range may not be longer than 366 days." } },
    };

    expect(getApiErrorMessage(error, "fallback")).toBe("The selected range may not be longer than 366 days.");
  });

  it("prefers the field detail over the summary the exception carries", () => {
    const error = {
      response: {
        data: {
          message: "The given data was invalid.",
          errors: { file: ["The file must be a file of type: jpeg, png, jpg, webp, svg, ico, gif."] },
        },
      },
    };

    expect(getApiErrorMessage(error, "fallback")).toBe(
      "The file must be a file of type: jpeg, png, jpg, webp, svg, ico, gif.",
    );
  });

  it("ignores an empty field detail", () => {
    const error = { response: { data: { message: "Nope", errors: { file: [""] } } } };

    expect(getApiErrorMessage(error, "fallback")).toBe("Nope");
  });

  it("falls back when the body carries no usable message", () => {
    expect(getApiErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
    expect(getApiErrorMessage({ response: { data: { message: "" } } }, "fallback")).toBe("fallback");
    expect(getApiErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});

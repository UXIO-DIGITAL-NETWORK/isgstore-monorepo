import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ImageDropzone } from "./ImageDropzone";

/**
 * The uploading state.
 *
 * Encoding and uploading used to be invisible here: the dropzone kept the
 * Browse button live and left its own text on the picked filename for the whole
 * request, so a slow upload looked like a click that did nothing. The flag is
 * the caller's — it owns the mutation — and these two cases are what the
 * callers rely on it doing.
 */
const setup = (uploading = false) =>
  render(
    <ImageDropzone
      id="logo"
      label="Logo"
      caption="Up to 2 MB"
      onChange={vi.fn()}
      uploading={uploading}
    />,
  );

describe("ImageDropzone", () => {
  it("disables the picker and names the wait while a file is uploading", () => {
    setup(true);

    expect(screen.getByText("Uploading…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse files" })).toBeDisabled();
    expect(screen.getByLabelText("Logo")).toBeDisabled();
  });

  it("stays usable when nothing is in flight", () => {
    setup();

    expect(screen.queryByText("Uploading…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse files" })).toBeEnabled();
    expect(screen.getByLabelText("Logo")).toBeEnabled();
  });
});

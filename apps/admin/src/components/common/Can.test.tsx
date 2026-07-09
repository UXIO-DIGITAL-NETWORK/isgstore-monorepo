import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Can } from "./Can";
import { useAuthStore } from "@/store/useAuthStore";

describe("Can", () => {
  afterEach(() => {
    useAuthStore.setState({ permissions: ["*"] });
  });

  it("renders children when the permission is held", () => {
    useAuthStore.setState({ permissions: ["transactions.delete"] });
    render(<Can permission="transactions.delete">Delete</Can>);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("renders the fallback (default null) when the permission is missing", () => {
    useAuthStore.setState({ permissions: ["transactions.view"] });
    render(
      <Can
        permission="transactions.delete"
        fallback="No access"
      >
        Delete
      </Can>,
    );
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    expect(screen.getByText("No access")).toBeInTheDocument();
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCan } from "./useCan";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * RBAC UI gate contract (system_architecture.md §5). The wildcard default
 * (super-admin, ["*"]) makes every <Can> check trivially pass elsewhere in
 * the app, so this is the one place actually exercising the "denied" branch
 * the future-roles scaffold depends on.
 */
describe("useCan", () => {
  afterEach(() => {
    useAuthStore.setState({ permissions: ["*"] });
  });

  it("grants any permission when the wildcard is present", () => {
    useAuthStore.setState({ permissions: ["*"] });
    const { result } = renderHook(() => useCan("transactions.delete"));
    expect(result.current).toBe(true);
  });

  it("grants an exact permission match", () => {
    useAuthStore.setState({ permissions: ["transactions.delete"] });
    const { result } = renderHook(() => useCan("transactions.delete"));
    expect(result.current).toBe(true);
  });

  it("denies a permission that isn't held and isn't wildcarded", () => {
    useAuthStore.setState({ permissions: ["transactions.view"] });
    const { result } = renderHook(() => useCan("transactions.delete"));
    expect(result.current).toBe(false);
  });
});

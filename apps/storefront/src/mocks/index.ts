import type { AxiosInstance } from "axios";

import { createMockAdapter } from "./adapter";

export { createMockAdapter } from "./adapter";

/**
 * Swaps the Axios instance's adapter for the fixture-backed one.
 *
 * Called from `src/config/axios.ts` only when `VITE_USE_MOCK_DATA=true`; the
 * default build never reaches this module.
 */
export function installMockAdapter(instance: AxiosInstance): void {
  instance.defaults.adapter = createMockAdapter();

  console.warn(
    "[mocks] USE_MOCK_DATA=true — every API request is served from local fixtures. " +
      "Log in with any email/password to test the member area.",
  );
}

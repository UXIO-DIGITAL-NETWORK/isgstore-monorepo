import axios, { type AxiosAdapter, type AxiosResponse } from "axios";

import { handlers } from "./handlers";
import { matchHandler, parseRequestBody, pathOf } from "./match";
import type { MockMethod, MockRequest } from "./types";

/**
 * A short, uniform latency so the app exercises its real loading states
 * (skeletons, pending buttons) instead of resolving synchronously.
 */
const MOCK_DELAY_MS = 200;

/** The framework's default adapter, used for any URL we have no fixture for. */
const realAdapter = axios.getAdapter(axios.defaults.adapter);

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * An Axios adapter that answers from `src/mocks/handlers` instead of the
 * network. Interceptors still run, so callers, hooks and components behave
 * exactly as they do against the real API — only the payload differs.
 */
export function createMockAdapter(): AxiosAdapter {
  return async (config) => {
    const method = (config.method ?? "get").toUpperCase() as MockMethod;
    const path = pathOf(config.url);
    const found = matchHandler(method, path, handlers);

    if (!found) {
      // Surfaced loudly rather than answered with an empty body: a missing
      // fixture should look like a broken request, not a working empty page.
      console.warn(`[mocks] no fixture for ${method} ${path} — falling through to the real API.`);
      return realAdapter(config);
    }

    await delay(MOCK_DELAY_MS);

    const request: MockRequest = {
      method,
      path,
      params: { ...(config.params ?? {}) } as Record<string, unknown>,
      body: parseRequestBody(config.data),
      match: found.match,
      config,
    };

    const response = {
      data: found.handler.resolve(request),
      status: 200,
      statusText: "OK",
      headers: config.headers,
      config,
      request: {},
    } as AxiosResponse;

    return response;
  };
}

import type { AxiosRequestConfig } from "axios";

import type { ApiResponse } from "@/types/api.type";

export type MockMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface MockRequest {
  method: MockMethod;
  /** Request path without the query string, e.g. `/v1/games/mobile-legends`. */
  path: string;
  params: Record<string, unknown>;
  /** Parsed JSON body for write requests; `undefined` for GET/DELETE. */
  body: unknown;
  /** The capture groups produced by the handler's `pattern`. */
  match: RegExpMatchArray;
  config: AxiosRequestConfig;
}

/** A handler answers with the same envelope the Laravel API emits. */
export type MockEnvelope<T = unknown> = ApiResponse<T>;

export interface MockHandler {
  method: MockMethod;
  /** Matched against the path, in declaration order — put specific routes first. */
  pattern: RegExp;
  resolve: (request: MockRequest) => MockEnvelope;
}

import type { MockHandler, MockMethod } from "./types";

/** Strips a query string, since callers pass filters through `config.params`. */
export function pathOf(url: string | undefined): string {
  return (url ?? "").split("?")[0];
}

/**
 * Axios serialises a request body to a JSON string before the adapter runs, so
 * a write handler has to parse it back to read fields like `promo_code`.
 */
export function parseRequestBody(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return data;
  }
}

/** First handler whose method and pattern match — declaration order wins. */
export function matchHandler(
  method: string,
  path: string,
  handlers: readonly MockHandler[],
): { handler: MockHandler; match: RegExpMatchArray } | null {
  const upper = method.toUpperCase() as MockMethod;

  for (const handler of handlers) {
    if (handler.method !== upper) continue;
    const match = path.match(handler.pattern);
    if (match) return { handler, match };
  }

  return null;
}

import { ok } from "../envelope";
import { MOCK_USER } from "../data/member";
import type { MockHandler, MockRequest } from "../types";

/** A pair of opaque strings is all the client stores — the value is irrelevant. */
const MOCK_TOKENS = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
};

function authResponse(request: MockRequest) {
  const body = (request.body ?? {}) as { name?: string; email?: string };
  // Any credentials succeed: the member area is what a tester came to see.
  const user = { ...MOCK_USER, name: body.name ?? MOCK_USER.name, email: body.email ?? MOCK_USER.email };
  return ok({ user, ...MOCK_TOKENS }, "Berhasil masuk.");
}

export const authHandlers: MockHandler[] = [
  { method: "POST", pattern: /^\/v1\/auth\/login$/, resolve: authResponse },
  { method: "POST", pattern: /^\/v1\/auth\/google$/, resolve: authResponse },
  { method: "POST", pattern: /^\/v1\/auth\/register$/, resolve: authResponse },
  { method: "POST", pattern: /^\/v1\/auth\/refresh$/, resolve: () => ok(MOCK_TOKENS) },
  { method: "POST", pattern: /^\/v1\/auth\/logout$/, resolve: () => ok(null, "Berhasil keluar.") },
  { method: "POST", pattern: /^\/v1\/auth\/forgot-password$/, resolve: () => ok(null, "Tautan reset telah dikirim.") },
  { method: "POST", pattern: /^\/v1\/auth\/reset-password$/, resolve: () => ok(null, "Kata sandi berhasil direset.") },
  { method: "GET", pattern: /^\/v1\/me$/, resolve: () => ok(MOCK_USER) },
];

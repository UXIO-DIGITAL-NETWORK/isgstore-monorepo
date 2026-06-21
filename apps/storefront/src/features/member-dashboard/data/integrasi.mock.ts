export const MOCK_API_KEY =
  "sk_live_udn_4a8b2c9d1e5f7g3h6i0j2k8l4m1n5o9p3q7r2s6t8u0v4w1x5y9z3a7b2c4d8e";

export const INITIAL_WHITELIST_IPS: string[] = ["151.245.65.19"];

/** Generates a new random mock API key (used for the regenerate action). */
export function generateMockApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sk_live_udn_";
  for (let i = 0; i < 52; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

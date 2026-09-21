/**
 * "The site is switched off" — learned from the API, not from a setting.
 *
 * The Hub can suspend a deployment or let its licence lapse, and the API then
 * answers **503** with a `data.licence` block on every public route. That is the
 * only trustworthy signal: a public flag would be a claim the client's own
 * browser could ignore, and `maintenance_mode` — which this deliberately does
 * NOT reuse — is a different thing that fails open and is bypassed by any login.
 *
 * State lives here rather than in a component so it can be tested (this app's
 * vitest run does not execute `.tsx`) and so the axios interceptor, which has no
 * React context, can write to it.
 */
export interface SiteClosure {
  status: string;
  reason: string | null;
  ends_at: string | null;
  checkout_url: string | null;
}

type Listener = (closure: SiteClosure | null) => void;

/**
 * Paths the API keeps answering even while the site is switched off.
 *
 * A 200 from one of these is NOT evidence the public side is open, so it must
 * never clear the notice. Mirrors `EnsureSiteIsServing::ALWAYS_OPEN`, narrowed
 * to the ones this SPA actually calls: the public settings (branding for this
 * very notice), health probes, and the auth endpoints a client uses to log in
 * and pay to come back.
 */
const ALWAYS_OPEN = ["/storefront/settings", "/ping", "/health", "/auth/"];

/** Whether a request URL is on the always-open list above. */
export function isAlwaysOpenUrl(url: string | undefined): boolean {
  return !!url && ALWAYS_OPEN.some((path) => url.includes(path));
}

let current: SiteClosure | null = null;
const listeners = new Set<Listener>();

/** The closure the API last reported, or null while the site is open. */
export function getSiteClosure(): SiteClosure | null {
  return current;
}

export function subscribeSiteClosure(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Record a closure (or clear it). Idempotent on the status+reason pair so a
 * page firing six parallel requests does not re-render the notice six times.
 */
export function setSiteClosure(closure: SiteClosure | null): void {
  const same =
    current?.status === closure?.status &&
    current?.reason === closure?.reason &&
    current?.ends_at === closure?.ends_at;

  if (same) return;

  current = closure;
  listeners.forEach((listener) => listener(current));
}

/**
 * Read a closure out of a failed response, or null if this failure is something
 * else entirely.
 *
 * A 503 with no licence block is an ordinary outage — a restarting container, a
 * proxy with nothing behind it — and must NOT be reported to the customer as
 * "this shop has not paid its bill".
 */
export function closureFromError(error: unknown): SiteClosure | null {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;

  if (response?.status !== 503) return null;

  const licence = (response.data as { data?: { licence?: Partial<SiteClosure> } })?.data?.licence;

  if (!licence || typeof licence.status !== "string") return null;

  return {
    status: licence.status,
    reason: licence.reason ?? null,
    ends_at: licence.ends_at ?? null,
    checkout_url: licence.checkout_url ?? null,
  };
}

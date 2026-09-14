/**
 * The human-readable message the API sent, if any.
 *
 * Axios rejects with its own Error whose `.message` is only "Request failed
 * with status code 422" — useless to an admin who needs to know that their
 * date range was inverted or too long. Laravel puts the actionable text in
 * the response body.
 *
 * A validation failure carries both a summary (`message`, often the generic
 * "The given data was invalid.") and per-field detail (`errors`). The detail
 * is the one that names the actual problem — which file types are accepted,
 * say — so it wins over the summary.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown; errors?: unknown } } })?.response?.data;

  const errors = data?.errors;

  if (errors && typeof errors === "object") {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      const messages = Array.isArray(value) ? value : [value];
      const first = messages.find((entry) => typeof entry === "string" && entry.length > 0);

      if (typeof first === "string") return first;
    }
  }

  const message = data?.message;

  return typeof message === "string" && message.length > 0 ? message : fallback;
}

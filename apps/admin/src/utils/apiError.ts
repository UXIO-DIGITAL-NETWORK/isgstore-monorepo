/**
 * The human-readable message the API sent, if any.
 *
 * Axios rejects with its own Error whose `.message` is only "Request failed
 * with status code 422" — useless to an admin who needs to know that their
 * date range was inverted or too long. Laravel puts the actionable text in
 * the response body.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === "string" && message.length > 0 ? message : fallback;
}

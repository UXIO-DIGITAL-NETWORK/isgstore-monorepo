/**
 * The client's wording for a payout's status — and what that status means for
 * them.
 *
 * The list printed the raw enum, so a client read "PROCESSING" next to
 * "SETTLED" with nothing to tell them that one means the bank has it and the
 * other means the money is in their account, or which of the two is still
 * waiting on us. Both the label and the one-line hint belong to the locales;
 * only the mapping lives here, so a new status cannot mean something different
 * on the list than it does on the detail page.
 */
const KEY: Record<string, string> = {
  PENDING: "pending",
  APPROVED: "approved",
  PROCESSING: "processing",
  SETTLED: "settled",
  REJECTED: "rejected",
  FAILED: "failed",
};

/** Null for a status we have no wording for, so the badge keeps the raw enum. */
export function withdrawalStatusLabelKey(status: string | null | undefined): string | undefined {
  return status && KEY[status] ? `withdrawalStatus.${KEY[status]}.label` : undefined;
}

export function withdrawalStatusHintKey(status: string | null | undefined): string | undefined {
  return status && KEY[status] ? `withdrawalStatus.${KEY[status]}.hint` : undefined;
}

/**
 * Still moving: three states await someone else's action. The list used to poll
 * only PENDING and PROCESSING, so an APPROVED payout sat frozen on screen until
 * a reload.
 */
export function isWithdrawalInFlight(status: string | null | undefined): boolean {
  return status === "PENDING" || status === "APPROVED" || status === "PROCESSING";
}

/** Ended without the money arriving — the state that needs a next step, not a full stop. */
export function isWithdrawalFailed(status: string | null | undefined): boolean {
  return status === "REJECTED" || status === "FAILED";
}

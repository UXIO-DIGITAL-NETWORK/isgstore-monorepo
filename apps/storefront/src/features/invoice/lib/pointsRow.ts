/**
 * What the invoice's points row should say.
 *
 * The branching lives here rather than in `OrderDetailCard` because this app's
 * Vitest config is `include: ["src/**\/*.test.ts"]` with `environment: "node"` —
 * `.tsx` is not collected at all, so logic left in a component cannot be tested.
 * Same reason `checkout/lib/points.ts` exists.
 */

export interface PointsRowState {
  /**
   * - `estimate` — the order is still open; the figure is what it will earn.
   * - `earned`   — completed; the figure is what was actually granted.
   * - `guest`    — placed without an account, so it earns nothing. A note, not a number.
   * - `none`     — nothing worth saying (failed order, or a rule that earns zero).
   */
  kind: "estimate" | "earned" | "guest" | "none";
  points: number;
}

export interface PointsRowInput {
  earned?: number;
  isEstimate?: boolean;
  eligible?: boolean;
}

export function pointsRowState({ earned, isEstimate, eligible }: PointsRowInput): PointsRowState {
  // An older API sends no points block at all; say nothing rather than guess.
  if (eligible === undefined && earned === undefined) return { kind: "none", points: 0 };

  // A guest earns nothing whatever the rule says, so the invitation is the only
  // honest thing to show — and it is shown without a figure, because the order
  // is already placed and no account can be attached to it retroactively.
  if (eligible === false) return { kind: "guest", points: 0 };

  const points = Math.max(0, earned ?? 0);

  if (points <= 0) return { kind: "none", points: 0 };

  return { kind: isEstimate ? "estimate" : "earned", points };
}

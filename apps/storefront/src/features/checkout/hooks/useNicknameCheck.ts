import { useCallback, useEffect, useRef, useState } from "react";

import { parseNickname } from "@/features/checkout/lib/nickname";
import { useValidateGameIdMutation } from "@/features/checkout/hooks/useCheckoutQueries";

interface Options {
  /** Game slug the lookup is scoped to. */
  slug: string;
  /** `supports_nickname_check` — false means this game has no provider at all. */
  supported: boolean;
  userId: string;
  serverId: string;
}

/**
 * Owns the "Cek Username" result for the account step.
 *
 * The lookup stays user-initiated (for some games it is a paid supplier
 * inquiry), but it must have run before the confirmation modal opens —
 * otherwise the buyer confirms a purchase against an id nobody verified. So
 * there are two entry points: `checkNow` for the button, and `ensureChecked`
 * for the Top Up gate, which reuses an existing result instead of paying for
 * a second inquiry.
 */
export function useNicknameCheck({ slug, supported, userId, serverId }: Options) {
  const mutation = useValidateGameIdMutation(slug);
  const { mutateAsync } = mutation;

  // Identity of the id pair a result belongs to. The result is stored WITH its
  // key rather than cleared by an effect, so editing the id invalidates the old
  // answer in the same render it changes — there is never a frame showing a
  // name that belongs to a different account.
  const idKey = `${userId.trim()}|${serverId.trim()}`;
  const [result, setResult] = useState<{ key: string; nickname: string | null } | null>(null);

  const checked = result !== null && result.key === idKey;
  const nickname = checked ? result.nickname : null;

  // Read inside the async lookup to spot an id that moved on while we waited.
  const idKeyRef = useRef(idKey);
  useEffect(() => {
    idKeyRef.current = idKey;
  }, [idKey]);

  /** Runs the lookup and returns the resolved name — never reads state back. */
  const runCheck = useCallback(async (): Promise<string | null> => {
    const targetUid = userId.trim();
    if (!targetUid) return null;

    const key = `${targetUid}|${serverId.trim()}`;
    let resolved: string | null = null;

    try {
      const data = await mutateAsync({
        target_uid: targetUid,
        target_server: serverId.trim() || undefined,
      });
      resolved = parseNickname(data.nickname);
    } catch {
      // A provider outage and a rejected id are indistinguishable from here:
      // both mean no name, and the caller treats that the same way. Swallowing
      // it also fixes the silent failure where the button just stopped
      // spinning with nothing shown.
      resolved = null;
    }

    // The id moved on while we waited — drop the answer and report "no name"
    // so nothing downstream acts on a stale account.
    if (idKeyRef.current !== key) return null;

    setResult({ key, nickname: resolved });

    return resolved;
  }, [mutateAsync, userId, serverId]);

  /** "Cek Username" button — fire and forget; the render reacts to the state. */
  const checkNow = useCallback(() => {
    void runCheck();
  }, [runCheck]);

  /**
   * Gate for "Top Up Sekarang". Resolves true when the purchase may proceed:
   * already-checked ids reuse their result, unchecked ones are looked up now.
   */
  const ensureChecked = useCallback(async (): Promise<boolean> => {
    if (!supported) return true;
    if (checked) return nickname !== null;

    return (await runCheck()) !== null;
  }, [supported, checked, nickname, runCheck]);

  return {
    nickname,
    /** True once a lookup has run for the current id — drives "not found". */
    checked,
    isChecking: mutation.isPending,
    checkNow,
    ensureChecked,
  };
}

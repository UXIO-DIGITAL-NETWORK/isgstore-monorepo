import type { TFunction } from "i18next";

/** An option before its label is resolved. */
export interface KeyedOption {
  value: string;
  labelKey: string;
}

/**
 * Resolve a keyed option list at render time.
 *
 * Select options are usually declared as module constants, which means a
 * `label` written there is frozen at whichever language happened to be loaded
 * when the module was imported — and never updates when the admin switches.
 * Carrying a key and resolving it here is what keeps those lists in step.
 */
export const translateOptions = (
  options: ReadonlyArray<KeyedOption>,
  t: TFunction<never>,
): { value: string; label: string }[] => options.map(({ value, labelKey }) => ({ value, label: t(labelKey) }));

import type { OrderFormField } from "@/types/models/game.model";

/**
 * A failed rule, as an i18n key plus whatever the message interpolates. The
 * component translates it — this module stays free of `t()` so it can be
 * tested as a pure function.
 */
export interface OrderFormFieldError {
  key: string;
  values?: Record<string, number>;
}

/**
 * Check the account step against the rules the game itself declared in
 * `order_form_fields`.
 *
 * This is the only guard a game without a nickname provider gets: nothing
 * downstream can tell a typo'd id from a real one until the supplier rejects
 * the order — after the buyer has paid. Games that DO have a provider get this
 * plus the live lookup (`useNicknameCheck`).
 *
 * Keyed by the field's own `key`, so a game declaring more identifiers than the
 * two the old positional layout could carry is validated just as well as one
 * declaring two.
 */
export function getOrderFormErrors(
  fields: OrderFormField[],
  values: Record<string, string>,
): Record<string, OrderFormFieldError | null> {
  const errors: Record<string, OrderFormFieldError | null> = {};

  for (const field of fields) {
    const value = (values[field.key] ?? "").trim();

    if (value === "") {
      errors[field.key] = field.required ? { key: "accountDetail.errors.required" } : null;

      continue;
    }

    // `number` fields render as text inputs on purpose (a real number input
    // strips the leading zeros some supplier ids carry), so the digit rule is
    // enforced here rather than by the browser.
    if (field.type === "number" && !/^\d+$/.test(value)) {
      errors[field.key] = { key: "accountDetail.errors.numeric" };

      continue;
    }

    if (field.min_length !== null && value.length < field.min_length) {
      errors[field.key] = { key: "accountDetail.errors.minLength", values: { length: field.min_length } };

      continue;
    }

    if (field.max_length !== null && value.length > field.max_length) {
      errors[field.key] = { key: "accountDetail.errors.maxLength", values: { length: field.max_length } };

      continue;
    }

    if (field.pattern) {
      let regex: RegExp | null = null;

      try {
        regex = new RegExp(field.pattern);
      } catch {
        // The pattern is admin-entered data. A malformed one is a
        // misconfiguration, not a reason to fail the buyer's valid id.
        regex = null;
      }

      if (regex && !regex.test(value)) {
        errors[field.key] = { key: "accountDetail.errors.pattern" };

        continue;
      }
    }

    errors[field.key] = null;
  }

  return errors;
}

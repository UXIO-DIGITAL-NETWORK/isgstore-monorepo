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
 * Returns one entry per field, index-aligned with `values`; `null` means valid.
 */
export function getOrderFormErrors(
  fields: OrderFormField[],
  values: string[],
): (OrderFormFieldError | null)[] {
  return fields.map((field, index) => {
    const value = (values[index] ?? "").trim();

    if (value === "") {
      return field.required ? { key: "accountDetail.errors.required" } : null;
    }

    // `number` fields render as text inputs on purpose (a real number input
    // strips the leading zeros some supplier ids carry), so the digit rule is
    // enforced here rather than by the browser.
    if (field.type === "number" && !/^\d+$/.test(value)) {
      return { key: "accountDetail.errors.numeric" };
    }

    if (field.min_length !== null && value.length < field.min_length) {
      return { key: "accountDetail.errors.minLength", values: { length: field.min_length } };
    }

    if (field.max_length !== null && value.length > field.max_length) {
      return { key: "accountDetail.errors.maxLength", values: { length: field.max_length } };
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
        return { key: "accountDetail.errors.pattern" };
      }
    }

    return null;
  });
}

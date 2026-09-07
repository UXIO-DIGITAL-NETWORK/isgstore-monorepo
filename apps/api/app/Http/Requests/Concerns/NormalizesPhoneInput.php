<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Support\Phone;

/**
 * Rewrites phone input to canonical E.164 **before** the rules run.
 *
 * `prepareForValidation()` is the only correct seam for this, and the reason is
 * `unique:users,phone`: normalising later — in the DTO or the action — would let
 * `0812…` and `+62812…` both pass the uniqueness check and then land as two
 * rows for one person. Everything downstream (`validated()`, and
 * `CheckoutController`'s `$request->string('guest_contact')`, which reads the
 * input rather than the validated set) sees the canonical value because
 * `merge()` mutates the request itself.
 *
 * Two rules that look like nitpicks and are not:
 *
 *  - **Never materialise a key the caller did not send.** `guest_contact` is
 *    `required` for a guest and `nullable` for a member, and several profile
 *    requests use `sometimes`. Merging a `null` for an absent key turns "the
 *    member did not touch this field" into "the member cleared it", and turns a
 *    guest's clear "wajib diisi" into a confusing format error.
 *  - **Keep the raw value when normalisation fails.** Replacing a typo with
 *    `null` hides it behind `required`/`nullable`; leaving it lets the E.164
 *    rule say what is actually wrong with what they typed.
 */
trait NormalizesPhoneInput
{
    /**
     * The canonical shape. A country code never begins with 0, so this is also
     * what enforces "no leading zero" — structurally, not by stripping.
     */
    public const E164_RULE = 'regex:/^\+[1-9]\d{7,14}$/';

    /**
     * @param  list<string>  $keys
     */
    protected function normalizePhoneFields(array $keys): void
    {
        $normalized = [];

        foreach ($keys as $key) {
            if (! $this->has($key)) {
                continue;
            }

            $raw = $this->input($key);

            if (! is_string($raw) || trim($raw) === '') {
                continue;
            }

            $canonical = Phone::toE164($raw);

            if ($canonical !== null) {
                $normalized[$key] = $canonical;
            }
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }
}

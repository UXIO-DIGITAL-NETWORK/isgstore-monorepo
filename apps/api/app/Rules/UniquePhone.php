<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\User;
use App\Support\Phone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * "Is this phone number already registered?", asked over every spelling it
 * could have been stored as.
 *
 * A plain `unique:users,phone` compares one string against a column that holds
 * three: contact numbers are only normalised on write from the release that
 * introduced E.164, and the existing rows were deliberately not migrated. So a
 * returning customer stored as `0812…` who registers again — now normalised to
 * `+62812…` — would not collide, and would quietly get a second account.
 *
 * That is worse than a cosmetic duplicate. The new row carries no order history,
 * so the member area and "Cek Pesanan" show them nothing; and the refund claim
 * form's "Nomor WhatsApp sudah terdaftar. Masuk ke akun tersebut…" never fires,
 * so a customer mid-refund creates a fresh account, still matches the refund by
 * phone (`RefundContactMatcher` compares spelling sets in both directions), and
 * takes their balance into an account they will not log back into.
 *
 * `whereIn` over at most five constants on a unique varchar stays index-friendly
 * — the same access pattern `TrackOrdersAction` already relies on — so this
 * costs nothing and needs no migration or backfill.
 */
class UniquePhone implements ValidationRule
{
    public function __construct(
        /** User id to exclude, when the owner is updating their own number. */
        private readonly ?int $ignoreId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            return;
        }

        $candidates = Phone::candidates($value);

        if ($candidates === []) {
            // Too short to be a number; the format rule owns that verdict.
            return;
        }

        $taken = User::query()
            ->whereIn('phone', $candidates)
            ->when($this->ignoreId !== null, fn ($q) => $q->whereKeyNot($this->ignoreId))
            ->exists();

        if ($taken) {
            $fail('Nomor WhatsApp sudah terdaftar.');
        }
    }
}

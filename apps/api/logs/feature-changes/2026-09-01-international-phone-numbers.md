# Phone numbers become international (E.164, never a leading zero)

## What changed

Contact phone numbers accept any country. The canonical stored form is E.164
with the plus — `+6281234567890`, `+6591234567` — and it can never begin with a
`0`, because an E.164 country code cannot.

There is no country picker and no new dependency. A customer who types `+65…` is
taken at their word; `0812…` or a bare national number still falls back to
Indonesia, which is now `config('services.storefront.default_country_code')`
rather than a constant in the helper.

## Why it is shaped this way

**The frontend was corrupting foreign numbers, not merely refusing them.**
`toNationalPhone` stripped a leading `0` *and* a leading country code. A stored
`+6591234567` came back into the settings field as `6591234567`, and saving it
produced `+626591234567` — a different, invalid number, every time the customer
opened the page. On the register form it ran per keystroke and ate the `+` the
moment it was typed, so a foreign code could never be entered at all. Replacing
it with a `+`-preserving sanitiser is the substance of the frontend change; the
dead `+62` chips were only the symptom.

**`unique:users,phone` had to become spelling-aware.** Old rows were never
migrated, so the column holds `0812…`, `62812…` and `+62812…` at once. A plain
unique compares one string against three: a returning customer stored as `0812…`
would not collide with their own normalised `+62812…` and would quietly get a
second account — with no order history, and with the refund claim form's
"already registered, sign in instead" hint never firing. `App\Rules\UniquePhone`
asks the question over `Phone::candidates()`. `RegisterAndPasswordResetTest`
passing **unchanged** is the proof it works.

**Normalisation lives in `prepareForValidation()`.** Anywhere later and the
uniqueness check would run on the un-normalised value, which is the whole
problem above.

**Two Indonesian consumers are guarded rather than internationalised.**
Monetapay settles in IDR to Indonesian e-wallets where the phone *is* the
beneficiary, so `account_phone` goes through `toIndonesianLocal()` and falls back
to the existing placeholder instead of forwarding a foreign number. The same
guard covers `ProcessWithdrawalPayoutJob`'s `merchant?->phone` fallback — the one
path an international contact number could have leaked into a disbursement and
failed only after money moved.

## Decisions taken (product)

1. Type your own `+code`; no picker, no library.
2. Canonical E.164 with the plus.
3. No backfill — only new writes are normalised, so `Phone::candidates()` stays
   as the read-side matcher.
4. Payout phones (`account_phone`) stay Indonesia-only.

## Surface

**API** — `Phone::toE164()` gains a country parameter and an 8–15 digit gate;
`candidates()` generalised (and no longer emits the impossible `+0…` spelling);
new `Phone::toIndonesianLocal()`. New `app/Http/Requests/Concerns/NormalizesPhoneInput.php`
and `app/Rules/UniquePhone.php`, applied to the five `phone` requests and the
three `guest_contact` ones. New `config('services.storefront.default_country_code')`.
Guards in `MonetapayService` and `ProcessWithdrawalPayoutJob`. Spelling-aware
search in `GetTransactionsAction`, `ExportTransactionsAction`, and the sibling-claim
count in `ListRefundRequestsAction` (which also no longer risks an empty `where ()`
when a contact is too short to be a number).

**Storefront** — `lib/phone.ts` rewritten around `sanitizePhoneInput`; the `00`
prefix branch is now terminal (it previously fell through and re-prepended `62`);
`+62` chips become `+` hints; zod rules validate the canonical form the request
actually carries, not the visible text.

No migration: E.164 is at most 16 characters with the plus, and the narrowest
column is `varchar(20)`.

## Known and accepted

A foreign number typed **bare** — a Singaporean `91234567` with no plus — reads
as Indonesian. That is inherent to supporting country codes without a picker. It
is an exact collision in "Cek Pesanan", not enumeration, and it is documented in
`Phone::candidates()`.

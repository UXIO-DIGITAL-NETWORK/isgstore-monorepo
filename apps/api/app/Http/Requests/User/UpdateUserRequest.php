<?php

namespace App\Http\Requests\User;

use App\Http\Requests\Concerns\NormalizesPhoneInput;
use App\Rules\UniquePhone;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    use NormalizesPhoneInput;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizePhoneFields(['phone']);
    }

    public function rules(): array
    {
        return [
            'role_id' => ['sometimes', 'exists:roles,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,'.$this->route('user')->id],
            'password' => ['nullable', 'string', 'min:8'],
            // Canonical E.164, rewritten by prepareForValidation(). The regex
            // is what forbids a leading zero — a country code cannot start with
            // one — and `UniquePhone` asks the question over every legacy
            // spelling the column may still hold.
            'phone' => ['sometimes', 'string', 'max:20', self::E164_RULE, new UniquePhone((int) $this->route('user')->id)],
            // `balance` and `point` are deliberately NOT accepted. They are money,
            // and every rupiah that moves has to leave a row in
            // balance_mutations / point_ledger with the user row locked — see
            // WalletLedger. This endpoint wrote the columns directly, so the
            // ledger stopped reconciling and a concurrent checkout could lose an
            // update. Operators move money through
            // /users/{user}/balance-adjustments, which is audited and demands a
            // reason.
            'locale' => ['sometimes', 'string', 'max:10'],
            // No `timezone`: the platform runs on one wall clock (WIB) — see
            // UserDTO. Accepting a zone here would let an edit pull one
            // account's clock away from the zone its reports are bucketed in.
        ];
    }
}

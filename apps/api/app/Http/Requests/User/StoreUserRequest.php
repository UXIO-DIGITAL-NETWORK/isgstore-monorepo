<?php

namespace App\Http\Requests\User;

use App\Http\Requests\Concerns\NormalizesPhoneInput;
use App\Rules\UniquePhone;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    use NormalizesPhoneInput;

    public function authorize(): bool
    {
        return true; // Asumsi middleware Role membatasi akses di Route
    }

    protected function prepareForValidation(): void
    {
        $this->normalizePhoneFields(['phone']);
    }

    public function rules(): array
    {
        return [
            'role_id' => ['required', 'exists:roles,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            // Canonical E.164, rewritten by prepareForValidation(). The regex
            // is what forbids a leading zero — a country code cannot start with
            // one — and `UniquePhone` asks the question over every legacy
            // spelling the column may still hold.
            'phone' => ['required', 'string', 'max:20', self::E164_RULE, new UniquePhone],
            // No `balance`/`point`: a new account starts at zero, and an opening
            // balance is an audited adjustment like any other movement — see the
            // note in UpdateUserRequest.
            'locale' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:50'],
        ];
    }
}

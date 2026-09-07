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
            'balance' => ['sometimes', 'numeric', 'min:0'],
            'point' => ['sometimes', 'integer', 'min:0'],
            'locale' => ['sometimes', 'string', 'max:10'],
            'timezone' => ['sometimes', 'string', 'max:50'],
        ];
    }
}

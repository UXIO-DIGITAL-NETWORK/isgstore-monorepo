<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\DTOs\Auth\RegisterDTO;
use App\Http\Requests\Concerns\NormalizesPhoneInput;
use App\Rules\UniquePhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:3', 'max:255'],
            'username' => ['nullable', 'string', 'min:3', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            // Canonical E.164, rewritten by prepareForValidation(). The regex
            // is what forbids a leading zero — a country code cannot start with
            // one — and `UniquePhone` asks the question over every legacy
            // spelling the column may still hold.
            'phone' => ['required', 'string', 'max:20', self::E164_RULE, new UniquePhone],
            // `confirmed` pairs with password_confirmation, which is what the
            // storefront's register form already sends.
            'password' => ['required', 'confirmed', Password::min(6)],
            'timezone' => ['nullable', 'string', 'timezone'],
            'locale' => ['nullable', 'string', 'max:5'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email sudah terdaftar.',
            'phone.unique' => 'Nomor WhatsApp sudah terdaftar.',
            'username.unique' => 'Username sudah digunakan.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ];
    }

    public function toDTO(): RegisterDTO
    {
        return new RegisterDTO(
            name: $this->validated('name'),
            email: $this->validated('email'),
            phone: $this->validated('phone'),
            password: $this->validated('password'),
            username: $this->validated('username'),
            timezone: $this->validated('timezone'),
            locale: $this->validated('locale'),
        );
    }
}

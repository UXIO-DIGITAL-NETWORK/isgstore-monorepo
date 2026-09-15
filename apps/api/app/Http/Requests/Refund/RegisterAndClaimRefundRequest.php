<?php

declare(strict_types=1);

namespace App\Http\Requests\Refund;

use App\DTOs\Auth\RegisterDTO;
use App\Http\Requests\Concerns\NormalizesPhoneInput;
use App\Rules\UniquePhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Creating an account in order to receive a refund as balance.
 *
 * The rules mirror `Auth\RegisterRequest` exactly, on purpose: this creates a
 * perfectly ordinary member account (through the same `RegisterAction`, so the
 * seeded-member-role invariant is not duplicated), and an account made here
 * must not be weaker than one made on the signup page.
 *
 * Whether the email or phone is *allowed* to take this particular refund is not
 * a validation question — it depends on the refund the token resolves to, so it
 * lives in `RefundContactMatcher`, behind the resolved token.
 */
class RegisterAndClaimRefundRequest extends FormRequest
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
            'password' => ['required', 'confirmed', Password::min(6)],
            // No `timezone`: one platform wall clock (WIB), as on signup — see
            // RegisterRequest.
            'locale' => ['nullable', 'string', 'max:5'],
        ];
    }

    public function messages(): array
    {
        return [
            // The one place these differ from signup: a customer arriving here
            // already has an order, so "already registered" is a signpost to
            // the sign-in tab rather than a dead end.
            'email.unique' => 'Email sudah terdaftar. Masuk ke akun tersebut untuk mengklaim pengembalian dana.',
            'phone.unique' => 'Nomor WhatsApp sudah terdaftar. Masuk ke akun tersebut untuk mengklaim pengembalian dana.',
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
            locale: $this->validated('locale'),
        );
    }
}

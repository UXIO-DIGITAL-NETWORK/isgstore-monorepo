<?php

declare(strict_types=1);

namespace App\Http\Requests\Member;

use App\DTOs\Member\UpdateProfileDTO;
use App\Http\Requests\Concerns\NormalizesPhoneInput;
use App\Rules\UniquePhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    use NormalizesPhoneInput;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        // Also the self-heal: a member who saves their profile writes their own
        // row back in canonical form. One row, on an action they started — not
        // a backfill.
        $this->normalizePhoneFields(['phone']);
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['sometimes', 'string', 'min:3', 'max:255'],
            // Uniqueness ignores the caller's own row, so re-submitting an
            // unchanged form is not a validation error.
            'username' => ['sometimes', 'nullable', 'string', 'min:3', 'max:50', 'alpha_dash', Rule::unique('users', 'username')->ignore($userId)],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            // Canonical E.164, rewritten by prepareForValidation(). The regex
            // is what forbids a leading zero — a country code cannot start with
            // one — and `UniquePhone` asks the question over every legacy
            // spelling the column may still hold.
            'phone' => ['sometimes', 'string', 'max:20', self::E164_RULE, new UniquePhone($userId)],
            'locale' => ['sometimes', 'string', 'max:5'],
            'avatar' => ['sometimes', 'file', 'image', 'max:2048'],
        ];
    }

    public function toDTO(): UpdateProfileDTO
    {
        return new UpdateProfileDTO(
            name: $this->validated('name'),
            username: $this->validated('username'),
            email: $this->validated('email'),
            phone: $this->validated('phone'),
            locale: $this->validated('locale'),
            avatar: $this->file('avatar'),
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests\Member;

use App\DTOs\Member\UpdateProfileDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
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
            'phone' => ['sometimes', 'string', 'min:9', 'max:20', Rule::unique('users', 'phone')->ignore($userId)],
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

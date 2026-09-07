<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\DTOs\Auth\GoogleLoginDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GoogleLoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'credential' => ['required', 'string'],
            'timezone' => ['nullable', 'string', 'timezone'], // Optional timezone sync (same as login)
        ];
    }

    /**
     * Map request to DTO.
     */
    public function toDTO(): GoogleLoginDTO
    {
        return new GoogleLoginDTO(
            credential: $this->validated('credential'),
            timezone: $this->validated('timezone'),
        );
    }
}

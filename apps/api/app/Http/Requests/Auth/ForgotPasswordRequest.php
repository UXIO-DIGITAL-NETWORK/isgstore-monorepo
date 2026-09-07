<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // No `exists` rule on purpose — validating existence here would tell an
        // attacker which addresses have accounts.
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
        ];
    }
}

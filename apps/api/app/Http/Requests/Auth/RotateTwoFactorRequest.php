<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RotateTwoFactorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // The code is checked against the LIVE secret in the action, and a
        // wrong password and a wrong code answer identically — neither tells
        // the caller which half they got wrong.
        return [
            'password' => ['required', 'string'],
            'code' => ['required', 'string'],
        ];
    }
}

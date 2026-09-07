<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class SetUserStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:active,suspended,banned'],
        ];
    }
}

<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;

class SetCategoryStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'boolean'],
        ];
    }
}

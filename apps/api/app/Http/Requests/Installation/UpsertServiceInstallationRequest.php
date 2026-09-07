<?php

namespace App\Http\Requests\Installation;

use Illuminate\Foundation\Http\FormRequest;

class UpsertServiceInstallationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The `payment-internal` middleware gates the route.
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

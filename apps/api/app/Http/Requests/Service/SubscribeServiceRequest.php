<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class SubscribeServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The `payment-admin` middleware gates the route; the action scopes the
        // invoice to the caller's own id.
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}

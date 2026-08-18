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
            // The bill is opened with its payment in one step, so the channel
            // is required here rather than picked on a later screen.
            'payment_channel_id' => ['required', 'integer', 'exists:payment_channels,id'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Requests\Service;

use App\Enums\ServiceCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50', 'unique:services,code'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::enum(ServiceCategory::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'payment_channel_id' => ['nullable', 'integer', 'exists:payment_channels,id'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}

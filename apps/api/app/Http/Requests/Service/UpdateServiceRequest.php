<?php

namespace App\Http\Requests\Service;

use App\Enums\ServiceCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'sometimes', 'string', 'max:50',
                Rule::unique('services', 'code')->ignore($this->route('service')?->id),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', Rule::enum(ServiceCategory::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:255'],
            'cost_price' => ['sometimes', 'integer', 'min:0'],
            'selling_price' => ['sometimes', 'integer', 'min:0'],
            'duration_days' => ['sometimes', 'integer', 'min:1'],
            'payment_channel_id' => ['nullable', 'integer', 'exists:payment_channels,id'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}

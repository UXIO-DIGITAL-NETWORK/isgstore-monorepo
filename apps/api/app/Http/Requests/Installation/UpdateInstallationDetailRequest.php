<?php

namespace App\Http\Requests\Installation;

use Illuminate\Foundation\Http\FormRequest;

/**
 * `value` is optional on update: an operator renaming a label must not have to
 * re-type an API key, and leaving it out keeps the secret from round-tripping
 * through the browser at all.
 */
class UpdateInstallationDetailRequest extends FormRequest
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
            'label' => ['sometimes', 'string', 'max:100'],
            'value' => ['sometimes', 'string', 'max:4000'],
            'is_secret' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}

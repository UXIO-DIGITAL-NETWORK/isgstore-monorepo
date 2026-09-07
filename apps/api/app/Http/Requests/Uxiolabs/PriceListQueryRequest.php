<?php

namespace App\Http\Requests\Uxiolabs;

use Illuminate\Foundation\Http\FormRequest;

class PriceListQueryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Query params arrive as strings — axios serializes a JS boolean to the
     * literal "true"/"false", which Laravel's `boolean` rule rejects (it accepts
     * only true/false/1/0/"1"/"0"). Normalize it to a real boolean first so any
     * client encoding (true, 1, 0, false) validates and the controller's
     * $request->boolean('only_unmapped') reads it correctly.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('only_unmapped')) {
            $this->merge([
                'only_unmapped' => filter_var($this->only_unmapped, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'only_unmapped' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

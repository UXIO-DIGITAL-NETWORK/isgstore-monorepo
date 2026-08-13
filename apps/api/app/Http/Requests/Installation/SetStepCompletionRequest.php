<?php

namespace App\Http\Requests\Installation;

use Illuminate\Foundation\Http\FormRequest;

/**
 * An explicit boolean rather than a toggle, so a double-tap or two open tabs
 * converge on the same state instead of flip-flopping.
 */
class SetStepCompletionRequest extends FormRequest
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
            'completed' => ['required', 'boolean'],
        ];
    }
}

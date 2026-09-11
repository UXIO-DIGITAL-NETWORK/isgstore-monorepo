<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Support\Locale\SupportedLocale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLocaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Constrained to what the platform actually ships. Storing anything
            // else leaves the account resolving to the fallback forever, with a
            // value on screen that never takes effect.
            'locale' => ['required', 'string', Rule::in(SupportedLocale::ALL)],
        ];
    }
}

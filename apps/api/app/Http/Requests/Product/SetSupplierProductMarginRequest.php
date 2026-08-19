<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SetSupplierProductMarginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'margin_member' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'margin_vip' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'margin_reseller' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'margin_agent' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
        ];
    }

    /**
     * @return array{member:?float,vip:?float,reseller:?float,agent:?float}
     */
    public function margins(): array
    {
        return [
            'member' => $this->filled('margin_member') ? (float) $this->validated('margin_member') : null,
            'vip' => $this->filled('margin_vip') ? (float) $this->validated('margin_vip') : null,
            'reseller' => $this->filled('margin_reseller') ? (float) $this->validated('margin_reseller') : null,
            'agent' => $this->filled('margin_agent') ? (float) $this->validated('margin_agent') : null,
        ];
    }
}

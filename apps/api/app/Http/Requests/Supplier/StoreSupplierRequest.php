<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Supplier\CreateSupplierDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): CreateSupplierDTO
    {
        return new CreateSupplierDTO(
            name: $this->validated('name'),
            status: $this->validated('status')
        );
    }
}

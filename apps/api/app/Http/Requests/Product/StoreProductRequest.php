<?php

namespace App\Http\Requests\Product;

use App\DTOs\Product\CreateProductDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'category_id' => ['required', 'exists:categories,id'],
            'sub_category_id' => ['nullable', 'exists:sub_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'sub_name' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'description' => ['nullable', 'string'],
            'validasi_nickname' => ['nullable', 'string', 'max:255'],
            'access' => ['nullable', 'string', 'max:255'],
            'tag' => ['nullable', 'string', 'max:255'],
            'is_available' => ['sometimes', 'boolean'],
            'code' => ['required', 'string', 'max:255', 'unique:products,code'],
            'price_modal' => ['required', 'integer'],
            'price_member' => ['required', 'integer'],
            'price_vip' => ['required', 'integer'],
            'price_reseller' => ['required', 'integer'],
            'price_agent' => ['required', 'integer'],
            'status' => ['required', 'boolean'],
            // Per-product loyalty points. Nullable on purpose: a blank field
            // means "fall back to the global points settings", which is not
            // the same as an explicit 0 ("this SKU earns nothing").
            'point_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'point_flat' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function toDTO(): CreateProductDTO
    {
        return new CreateProductDTO(
            categoryId: (int) $this->validated('category_id'),
            subCategoryId: $this->validated('sub_category_id') ? (int) $this->validated('sub_category_id') : null,
            name: $this->validated('name'),
            subName: $this->validated('sub_name'),
            code: $this->validated('code'),
            logo: $this->file('logo'),
            description: $this->validated('description'),
            validasiNickname: $this->validated('validasi_nickname'),
            access: $this->validated('access'),
            tag: $this->validated('tag'),
            priceModal: (int) $this->validated('price_modal'),
            priceMember: (int) $this->validated('price_member'),
            priceVip: (int) $this->validated('price_vip'),
            priceReseller: (int) $this->validated('price_reseller'),
            priceAgent: (int) $this->validated('price_agent'),
            status: (bool) $this->validated('status'),
            isAvailable: $this->has('is_available') ? $this->boolean('is_available') : true,
            // `filled()` rather than `has()`: an empty string from a multipart
            // form is the admin clearing the override, and must reach the model
            // as null, not as 0.
            pointPercent: $this->filled('point_percent') ? (float) $this->validated('point_percent') : null,
            pointFlat: $this->filled('point_flat') ? (int) $this->validated('point_flat') : null,
        );
    }
}

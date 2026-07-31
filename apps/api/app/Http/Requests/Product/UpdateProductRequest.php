<?php

namespace App\Http\Requests\Product;

use App\DTOs\Product\UpdateProductDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
        $productId = $this->route('product') ? $this->route('product')->id : null;

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
            'code' => ['required', 'string', 'max:255', Rule::unique('products', 'code')->ignore($productId)],
            'price_modal' => ['required', 'integer'],
            'price_member' => ['required', 'integer'],
            'price_vip' => ['required', 'integer'],
            'price_reseller' => ['required', 'integer'],
            'price_agent' => ['required', 'integer'],
            'status' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): UpdateProductDTO
    {
        return new UpdateProductDTO(
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
            isAvailable: $this->has('is_available') ? $this->boolean('is_available') : true
        );
    }
}

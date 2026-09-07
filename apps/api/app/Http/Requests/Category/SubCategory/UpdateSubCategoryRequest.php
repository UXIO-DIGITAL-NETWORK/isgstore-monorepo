<?php

namespace App\Http\Requests\Category\SubCategory;

use App\DTOs\Category\SubCategory\UpdateSubCategoryDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSubCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'currency_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            // FIX: Sama seperti Store request, ubah ke validasi gambar
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'status' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): UpdateSubCategoryDTO
    {
        return new UpdateSubCategoryDTO(
            categoryId: $this->validated('category_id'),
            name: $this->validated('name'),
            currencyName: $this->validated('currency_name'),
            description: $this->validated('description'),
            // Gunakan $this->file() khusus untuk mengambil file fisik
            logo: $this->file('logo'),
            status: $this->validated('status')
        );
    }
}

<?php

namespace App\Http\Requests\Category;

use App\DTOs\Category\UpdateCategoryDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
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
            'type_id' => ['required', 'exists:category_types,id'],
            'name' => ['required', 'string', 'max:255'],
            'sub_name' => ['nullable', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', Rule::unique('categories', 'code')->ignore($this->route('category'))],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($this->route('category'))],
            'uid_parser' => ['nullable', 'string', 'max:255'],
            'validasi_nickname' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'boolean'],
            'order_form_fields' => ['nullable', 'array'],
            'order_form_fields.*.key' => ['required_with:order_form_fields', 'string', 'max:255'],
            'order_form_fields.*.label' => ['nullable', 'string', 'max:255'],
            'order_form_fields.*.required' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:280'],
            'og_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'meta_keywords' => ['nullable', 'array'],
            'meta_keywords.*' => ['string', 'max:100'],
            'meta_robots' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function toDTO(): UpdateCategoryDTO
    {
        return new UpdateCategoryDTO(
            typeId: $this->validated('type_id'),
            name: $this->validated('name'),
            subName: $this->validated('sub_name'),
            code: $this->validated('code'),
            slug: $this->validated('slug'),
            uidParser: $this->validated('uid_parser'),
            validasiNickname: $this->validated('validasi_nickname'),
            region: $this->validated('region'),
            logo: $this->file('logo'),
            description: $this->validated('description'),
            status: $this->validated('status'),
            orderFormFields: $this->validated('order_form_fields'),
            metaTitle: $this->validated('meta_title'),
            metaDescription: $this->validated('meta_description'),
            ogImage: $this->file('og_image'),
            metaKeywords: $this->validated('meta_keywords'),
            metaRobots: $this->validated('meta_robots'),
        );
    }
}

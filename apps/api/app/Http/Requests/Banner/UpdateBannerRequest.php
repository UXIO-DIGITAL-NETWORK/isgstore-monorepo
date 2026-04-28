<?php

namespace App\Http\Requests\Banner;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Banner\UpdateBannerDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBannerRequest extends FormRequest
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
            'category_id' => ['nullable', 'exists:categories,id'],
            'name'        => ['required', 'string', 'max:255'],
            'image_path'  => ['required', 'string', 'max:255'],
            'link'        => ['nullable', 'string', 'max:255'],
        ];
    }

    public function toDTO(): UpdateBannerDTO
    {
        return new UpdateBannerDTO(
            categoryId: $this->validated('category_id') ? (int) $this->validated('category_id') : null,
            name: $this->validated('name'),
            imagePath: $this->validated('image_path'),
            link: $this->validated('link'),
        );
    }
}

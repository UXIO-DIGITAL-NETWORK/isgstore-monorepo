<?php

namespace App\Http\Requests\Announcement;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Announcement\UpdateAnnouncementDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
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
            'content'     => ['required', 'string'],
            'image_path'  => ['nullable', 'string', 'max:255'],
            'is_active'   => ['nullable', 'boolean'],
        ];
    }

    public function toDTO(): UpdateAnnouncementDTO
    {
        return new UpdateAnnouncementDTO(
            categoryId: $this->validated('category_id') ? (int) $this->validated('category_id') : null,
            content: $this->validated('content'),
            imagePath: $this->validated('image_path'),
            isActive: (bool) $this->validated('is_active', true),
        );
    }
}

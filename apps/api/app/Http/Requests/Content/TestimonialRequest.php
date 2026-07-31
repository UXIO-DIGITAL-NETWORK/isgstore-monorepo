<?php

namespace App\Http\Requests\Content;

use App\DTOs\Content\TestimonialDTO;
use Illuminate\Foundation\Http\FormRequest;

class TestimonialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'author_name' => ['required', 'string', 'max:255'],
            'author_title' => ['nullable', 'string', 'max:255'],
            'avatar_path' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'content' => ['required', 'string'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'game_name' => ['nullable', 'string', 'max:255'],
            'is_featured' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function toDTO(): TestimonialDTO
    {
        return new TestimonialDTO(
            authorName: $this->validated('author_name'),
            authorTitle: $this->validated('author_title'),
            avatarPath: $this->file('avatar_path'),
            content: $this->validated('content'),
            rating: $this->validated('rating') !== null ? (int) $this->validated('rating') : null,
            gameName: $this->validated('game_name'),
            isFeatured: $this->boolean('is_featured'),
            sortOrder: (int) ($this->validated('sort_order') ?? 0),
            isActive: $this->has('is_active') ? $this->boolean('is_active') : true,
        );
    }
}

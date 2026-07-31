<?php

namespace App\Http\Requests\Content;

use App\DTOs\Content\FaqDTO;
use Illuminate\Foundation\Http\FormRequest;

/**
 * One request class for store and update: an FAQ has the same required fields
 * either way, and there is no unique constraint to ignore on edit.
 */
class FaqRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'group' => ['nullable', 'string', 'max:255'],
            'locale' => ['nullable', 'string', 'max:5'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function toDTO(): FaqDTO
    {
        return new FaqDTO(
            question: $this->validated('question'),
            answer: $this->validated('answer'),
            group: $this->validated('group'),
            locale: $this->validated('locale') ?? 'id',
            sortOrder: (int) ($this->validated('sort_order') ?? 0),
            isActive: $this->has('is_active') ? $this->boolean('is_active') : true,
        );
    }
}

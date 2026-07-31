<?php

namespace App\Http\Requests\Article;

use App\DTOs\Article\ArticleCategoryDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreArticleCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('article_category')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            // The storefront's category pills are a closed set keyed on this
            // value, so it must stay stable and unique even as `name` changes.
            'key' => ['nullable', 'string', 'max:255', Rule::unique('article_categories', 'key')->ignore($id)],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'boolean'],
        ];
    }

    public function toDTO(): ArticleCategoryDTO
    {
        return new ArticleCategoryDTO(
            name: $this->validated('name'),
            key: $this->validated('key'),
            sortOrder: (int) ($this->validated('sort_order') ?? 0),
            status: $this->has('status') ? $this->boolean('status') : true,
        );
    }
}

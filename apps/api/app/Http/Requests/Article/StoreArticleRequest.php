<?php

namespace App\Http\Requests\Article;

use App\DTOs\Article\CreateArticleDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'article_category_id' => ['required', 'exists:article_categories,id'],
            'category_label' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in(['article', 'news'])],
            'locale' => ['nullable', 'string', 'max:5'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:300'],
            'author_name' => ['nullable', 'string', 'max:255'],
            // The body is a repeater of {heading?, paragraphs[]} sections —
            // validated structurally so a malformed section cannot reach the
            // storefront's renderer as a runtime error.
            'body_sections' => ['nullable', 'array'],
            'body_sections.*.heading' => ['nullable', 'string', 'max:255'],
            'body_sections.*.paragraphs' => ['required_with:body_sections', 'array'],
            'body_sections.*.paragraphs.*' => ['string'],
            'image_path' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'is_published' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:280'],
            'meta_keywords' => ['nullable', 'array'],
            'meta_keywords.*' => ['string', 'max:50'],
            'meta_robots' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * `body_sections` and `meta_keywords` arrive as JSON strings when the
     * request is multipart (an image upload) — FormData cannot carry a nested
     * array. Decoding here keeps the rules above operating on real arrays.
     */
    protected function prepareForValidation(): void
    {
        foreach (['body_sections', 'meta_keywords'] as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                $decoded = json_decode($value, true);
                $this->merge([$field => json_last_error() === JSON_ERROR_NONE ? $decoded : null]);
            }
        }
    }

    public function toDTO(): CreateArticleDTO
    {
        return new CreateArticleDTO(
            articleCategoryId: (int) $this->validated('article_category_id'),
            categoryLabel: $this->validated('category_label'),
            type: $this->validated('type'),
            locale: $this->validated('locale') ?? 'id',
            title: $this->validated('title'),
            slug: $this->validated('slug'),
            excerpt: $this->validated('excerpt'),
            authorName: $this->validated('author_name') ?? 'Admin',
            bodySections: $this->validated('body_sections'),
            imagePath: $this->file('image_path'),
            isPublished: $this->boolean('is_published'),
            isFeatured: $this->boolean('is_featured'),
            publishedAt: $this->validated('published_at'),
            metaTitle: $this->validated('meta_title'),
            metaDescription: $this->validated('meta_description'),
            metaKeywords: $this->validated('meta_keywords'),
            metaRobots: $this->validated('meta_robots'),
        );
    }
}

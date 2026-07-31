<?php

namespace App\Http\Requests\Content;

use App\DTOs\Content\PageDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $page = $this->route('page');
        $locale = $this->input('locale', 'id');

        return [
            // Unique per locale, not globally — the same page translated keeps
            // its slug.
            'slug' => [
                'required', 'string', 'max:255',
                Rule::unique('pages', 'slug')->where('locale', $locale)->ignore($page?->id),
            ],
            'locale' => ['nullable', 'string', 'max:5'],
            'title' => ['required', 'string', 'max:255'],
            'intro' => ['nullable', 'array'],
            'intro.*' => ['string'],
            'sections' => ['nullable', 'array'],
            'sections.*.heading' => ['nullable', 'string', 'max:255'],
            'sections.*.paragraphs' => ['required_with:sections', 'array'],
            'sections.*.paragraphs.*' => ['string'],
            'sections.*.bullets' => ['nullable', 'array'],
            'sections.*.bullets.*' => ['string'],
            'is_published' => ['sometimes', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:280'],
            'meta_robots' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function toDTO(): PageDTO
    {
        return new PageDTO(
            slug: $this->validated('slug'),
            locale: $this->validated('locale') ?? 'id',
            title: $this->validated('title'),
            intro: $this->validated('intro'),
            sections: $this->validated('sections'),
            isPublished: $this->has('is_published') ? $this->boolean('is_published') : true,
            metaTitle: $this->validated('meta_title'),
            metaDescription: $this->validated('meta_description'),
            metaRobots: $this->validated('meta_robots'),
        );
    }
}

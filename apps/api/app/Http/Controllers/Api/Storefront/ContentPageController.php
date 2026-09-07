<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\Page;
use App\Models\Setting;
use App\Models\Testimonial;
use App\Support\Storefront\MediaUrl;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public, read-only CMS surface: FAQ, static pages, testimonials, settings.
 *
 * Every projection is built field by field rather than serialising a model, so
 * a column added later cannot leak to the storefront by accident — the same
 * invariant the rest of the storefront controllers hold.
 */
class ContentPageController extends Controller
{
    use ApiResponse;

    public function faqs(Request $request): JsonResponse
    {
        $faqs = Faq::query()
            ->where('is_active', true)
            ->where('locale', $request->query('locale', 'id'))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Faq $faq) => [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'group' => $faq->group,
            ])
            ->values();

        return $this->successResponse($faqs, 'FAQs retrieved successfully');
    }

    public function page(Request $request, string $slug): JsonResponse
    {
        $page = Page::query()
            ->where('slug', $slug)
            ->where('locale', $request->query('locale', 'id'))
            ->where('is_published', true)
            ->first();

        if (! $page) {
            return $this->errorResponse('Page not found', 404);
        }

        return $this->successResponse([
            'slug' => $page->slug,
            'title' => $page->title,
            'intro' => $page->intro ?? [],
            'sections' => $page->sections ?? [],
            'meta' => [
                'title' => $page->meta_title ?? $page->title,
                'description' => $page->meta_description,
                'robots' => $page->meta_robots,
            ],
            'updated_at' => $page->updated_at,
        ], 'Page retrieved successfully');
    }

    public function testimonials(): JsonResponse
    {
        $testimonials = Testimonial::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Testimonial $row) => [
                'id' => $row->id,
                'author' => $row->author_name,
                'title' => $row->author_title,
                'avatar_url' => MediaUrl::for($row->avatar_path),
                'content' => $row->content,
                'rating' => $row->rating !== null ? (int) $row->rating : null,
                'game' => $row->game_name,
                'is_featured' => (bool) $row->is_featured,
            ])
            ->values();

        return $this->successResponse($testimonials, 'Testimonials retrieved successfully');
    }

    /**
     * A flat `{key: value}` map of the **public** settings only.
     *
     * The whitelist is the `is_public` column rather than a hardcoded list, so
     * marking a key public is a deliberate, auditable act — returning the whole
     * table is how an API credential ends up in a JS bundle.
     */
    public function settings(): JsonResponse
    {
        $settings = Setting::query()
            ->where('is_public', true)
            ->get()
            ->mapWithKeys(fn (Setting $setting) => [
                $setting->key => $setting->type === 'image'
                    ? MediaUrl::for($setting->value)
                    : $setting->typedValue(),
            ]);

        return $this->successResponse($settings, 'Settings retrieved successfully');
    }
}

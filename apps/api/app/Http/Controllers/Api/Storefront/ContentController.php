<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Banner;
use App\Support\Storefront\MediaUrl;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Read-only CMS surface for the homepage: hero banners and announcements.
 *
 * Separate from the admin BannerController/AnnouncementController so the public
 * projection can stay narrow and cannot accidentally inherit admin fields.
 */
class ContentController extends Controller
{
    use ApiResponse;

    public function banners(Request $request): JsonResponse
    {
        $categoryId = $request->integer('category_id');

        $resolved = Banner::query()
            // No category asked for means the homepage, where only the global
            // banners belong: an operator scoping a banner to one game means it
            // for that game, and returning it here showed it to every visitor.
            ->when(
                $categoryId > 0,
                fn ($query) => $query->where('category_id', $categoryId),
                fn ($query) => $query->whereNull('category_id'),
            )
            ->orderBy('id')
            ->get(['id', 'category_id', 'name', 'image_path', 'link'])
            ->map(fn (Banner $banner) => [
                'id' => $banner->id,
                'name' => $banner->name,
                'link' => $banner->link,
                'image_url' => MediaUrl::for($banner->image_path),
            ]);

        // A banner whose file is missing would render as a broken slide, so it
        // is dropped rather than shown.
        [$shown, $dropped] = $resolved->partition(fn (array $banner) => $banner['image_url'] !== null);

        if ($dropped->isNotEmpty()) {
            $this->warnAboutMissingImages($dropped);
        }

        return $this->successResponse($shown->values(), 'Banners retrieved successfully');
    }

    /**
     * Say so when a banner is dropped.
     *
     * Dropping is the right call for the visitor, but it is silent, and silence
     * is how ten seeded banners pointed at files that never existed while the
     * storefront looked like it was ignoring the API. Throttled to once an hour
     * because this is a public read.
     *
     * @param  Collection<int, array<string, mixed>>  $dropped
     */
    private function warnAboutMissingImages(Collection $dropped): void
    {
        if (! Cache::add('banners:missing-images-warned', true, now()->addHour())) {
            return;
        }

        Log::warning('Storefront banners dropped: their image files are missing', [
            'count' => $dropped->count(),
            'banners' => $dropped->map(fn (array $banner) => [
                'id' => $banner['id'],
                'name' => $banner['name'],
            ])->all(),
        ]);
    }

    public function announcements(): JsonResponse
    {
        $announcements = Announcement::query()
            ->where('is_active', true)
            ->latest('id')
            ->get(['id', 'category_id', 'content', 'image_path'])
            ->map(fn (Announcement $announcement) => [
                'id' => $announcement->id,
                'content' => $announcement->content,
                'image_url' => MediaUrl::for($announcement->image_path),
            ])
            ->values();

        return $this->successResponse($announcements, 'Announcements retrieved successfully');
    }
}

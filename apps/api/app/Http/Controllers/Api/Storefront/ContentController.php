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
        $banners = Banner::query()
            ->when($request->integer('category_id'), fn ($q, int $id) => $q->where('category_id', $id))
            ->orderBy('id')
            ->get(['id', 'category_id', 'name', 'image_path', 'link'])
            ->map(fn (Banner $banner) => [
                'id' => $banner->id,
                'name' => $banner->name,
                'link' => $banner->link,
                'image_url' => MediaUrl::for($banner->image_path),
            ])
            // A banner whose file is missing would render as a broken slide, so
            // it is dropped rather than shown.
            ->filter(fn (array $banner) => $banner['image_url'] !== null)
            ->values();

        return $this->successResponse($banners, 'Banners retrieved successfully');
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

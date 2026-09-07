<?php

namespace App\Actions\Content;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Content\PageDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Page;
use Illuminate\Support\Facades\Auth;

class SavePageAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(PageDTO $dto, ?Page $page = null): Page
    {
        $attributes = [
            'slug' => $dto->slug,
            'locale' => $dto->locale,
            'title' => $dto->title,
            'intro' => $dto->intro ?? [],
            'sections' => $dto->sections ?? [],
            'is_published' => $dto->isPublished,
            'meta_title' => $dto->metaTitle,
            'meta_description' => $dto->metaDescription,
            'meta_robots' => $dto->metaRobots,
        ];

        if ($page === null) {
            $page = Page::create($attributes);
            $verb = 'created';
        } else {
            $page->update($attributes);
            $verb = 'updated';
        }

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin {$verb} page: {$dto->title}",
        ));

        return $page->fresh();
    }
}

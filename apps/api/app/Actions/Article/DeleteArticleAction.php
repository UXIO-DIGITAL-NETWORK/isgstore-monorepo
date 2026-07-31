<?php

namespace App\Actions\Article;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Article;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DeleteArticleAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Article $article): bool
    {
        $title = $article->title;
        $imagePath = $article->image_path;

        $deleted = $article->delete();

        if ($deleted) {
            // Only reached once the row is gone, so a failed delete cannot
            // leave the article pointing at a file that no longer exists.
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Admin deleted article: {$title}",
            ));
        }

        return $deleted;
    }
}

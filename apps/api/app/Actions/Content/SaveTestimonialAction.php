<?php

namespace App\Actions\Content;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Content\TestimonialDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Testimonial;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class SaveTestimonialAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(TestimonialDTO $dto, ?Testimonial $testimonial = null): Testimonial
    {
        // Keep the current avatar unless a new file was actually uploaded.
        $avatarPath = $testimonial?->avatar_path;

        if ($dto->avatarPath instanceof UploadedFile) {
            if ($avatarPath && Storage::disk('public')->exists($avatarPath)) {
                Storage::disk('public')->delete($avatarPath);
            }
            $avatarPath = $dto->avatarPath->store('testimonials/avatars', 'public');
        }

        $attributes = [
            'author_name' => $dto->authorName,
            'author_title' => $dto->authorTitle,
            'avatar_path' => $avatarPath,
            'content' => $dto->content,
            'rating' => $dto->rating,
            'game_name' => $dto->gameName,
            'is_featured' => $dto->isFeatured,
            'sort_order' => $dto->sortOrder,
            'is_active' => $dto->isActive,
        ];

        if ($testimonial === null) {
            $testimonial = Testimonial::create($attributes);
            $verb = 'created';
        } else {
            $testimonial->update($attributes);
            $verb = 'updated';
        }

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin {$verb} testimonial by: {$dto->authorName}",
        ));

        return $testimonial->fresh();
    }
}

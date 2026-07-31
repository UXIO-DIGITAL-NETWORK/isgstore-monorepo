<?php

namespace App\Actions\Announcement;

use App\Models\Announcement;
use Illuminate\Pagination\LengthAwarePaginator;

class GetAnnouncementsAction
{
    public function execute(int $perPage = 15, ?string $search = null, ?int $categoryId = null): LengthAwarePaginator
    {
        return Announcement::with('category')
            ->when($search, fn ($query) => $query->where('content', 'like', "%{$search}%"))
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->latest()
            ->paginate($perPage);
    }
}

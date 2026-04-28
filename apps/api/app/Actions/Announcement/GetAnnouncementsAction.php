<?php

namespace App\Actions\Announcement;

use App\Models\Announcement;
use Illuminate\Pagination\LengthAwarePaginator;

class GetAnnouncementsAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Announcement::with('category')->latest()->paginate($perPage);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Actions\Announcement\CreateAnnouncementAction;
use App\Actions\Announcement\DeleteAnnouncementAction;
use App\Actions\Announcement\GetAnnouncementsAction;
use App\Actions\Announcement\UpdateAnnouncementAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Announcement\StoreAnnouncementRequest;
use App\Http\Requests\Announcement\UpdateAnnouncementRequest;
use App\Http\Resources\Api\Announcement\AnnouncementResource;
use App\Models\Announcement;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetAnnouncementsAction $action)
    {
        $announcements = $action->execute((int) $request->query('per_page', 15));

        return AnnouncementResource::collection($announcements);
    }

    public function store(StoreAnnouncementRequest $request, CreateAnnouncementAction $action)
    {
        $announcement = $action->execute($request->toDTO());

        return $this->success(
            new AnnouncementResource($announcement->load('category')),
            'Announcement created successfully',
            201
        );
    }

    public function show(Announcement $announcement)
    {
        return $this->success(
            new AnnouncementResource($announcement->load('category')),
            'Announcement retrieved successfully'
        );
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement, UpdateAnnouncementAction $action)
    {
        $announcement = $action->execute($announcement, $request->toDTO());

        return $this->success(
            new AnnouncementResource($announcement->load('category')),
            'Announcement updated successfully'
        );
    }

    public function destroy(Announcement $announcement, DeleteAnnouncementAction $action)
    {
        $action->execute($announcement);

        return $this->success(null, 'Announcement deleted successfully');
    }
}

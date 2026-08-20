<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\NotificationResource;
use App\Models\Notification;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * The payment-internal team's own notification feed. Every query is scoped to
 * the caller (`$request->user()->id`) before any filter, so one internal user
 * can never read, count, or mark another's fan-out row — the notifications
 * table holds one row per recipient by design.
 */
class NotificationController extends Controller
{
    use ApiResponse;

    /** Paginated feed, newest first. `?filter=unread` narrows to the badge set. */
    public function index(Request $request)
    {
        $notifications = Notification::query()
            ->where('user_id', $request->user()->id)
            ->when($request->query('filter') === 'unread', fn ($q) => $q->unread())
            ->latest()
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            NotificationResource::collection($notifications),
            'Notifications retrieved successfully',
        );
    }

    /** Unread tally that drives the navbar bell badge (polled). */
    public function unreadCount(Request $request)
    {
        $count = Notification::query()
            ->where('user_id', $request->user()->id)
            ->unread()
            ->count();

        return $this->successResponse(['unread_count' => $count], 'Unread count retrieved successfully');
    }

    /** Mark one notification read. Ownership-guarded — a foreign row 404s. */
    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return $this->errorResponse('Notification not found', 404);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return $this->successResponse(new NotificationResource($notification), 'Notification marked as read');
    }

    /** Clear the badge in one call — marks every unread row read for the caller. */
    public function markAllRead(Request $request)
    {
        $marked = Notification::query()
            ->where('user_id', $request->user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return $this->successResponse(['marked' => $marked], 'All notifications marked as read');
    }
}

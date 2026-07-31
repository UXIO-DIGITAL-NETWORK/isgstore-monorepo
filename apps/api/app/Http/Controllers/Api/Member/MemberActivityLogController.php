<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Enums\ActivityType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ActivityLogResource;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The caller's own activity log.
 *
 * Distinct from the admin ActivityLogController, which can read every user's
 * rows. This one is hard-scoped to `user_id` before any filter is applied.
 */
class MemberActivityLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', Rule::enum(ActivityType::class)],
            'ip' => ['nullable', 'string', 'max:45'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $logs = ActivityLog::query()
            ->where('user_id', $request->user()->id)
            ->when($validated['type'] ?? null, fn ($q, string $type) => $q->where('type', $type))
            ->when($validated['ip'] ?? null, fn ($q, string $ip) => $q->where('ip_address', $ip))
            ->when($validated['date_from'] ?? null, fn ($q, string $from) => $q->whereDate('created_at', '>=', $from))
            ->when($validated['date_to'] ?? null, fn ($q, string $to) => $q->whereDate('created_at', '<=', $to))
            ->latest('id')
            ->paginate((int) ($validated['per_page'] ?? 10));

        return $this->paginatedResponse(
            ActivityLogResource::collection($logs),
            'Activity logs retrieved successfully'
        );
    }
}

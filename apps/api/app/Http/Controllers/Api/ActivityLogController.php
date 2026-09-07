<?php

namespace App\Http\Controllers\Api;

use App\Enums\RoleType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ActivityLogResource;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $transactionId = $request->query('transaction_id');
        $search = $request->query('search');

        $logs = ActivityLog::with('user.role')
            // Topup-domain only: admin actions + storefront customers (members and
            // guests / system logs with no user). The payment page is a separate
            // product — its merchant (payment-admin) and finance (payment-internal)
            // activity has its own feed and must not leak in here.
            ->where(function (Builder $q) {
                $q->whereDoesntHave('user')
                    ->orWhereHas('user.role', fn (Builder $r) => $r->whereRaw('LOWER(name) NOT IN (?, ?)', [
                        RoleType::PAYMENT_ADMIN->value,
                        RoleType::PAYMENT_INTERNAL->value,
                    ]));
            })
            // Automated machine-to-machine events (order dispatch, gateway
            // callbacks, scheduled checks) are noise on the global feed — hide
            // them there, but keep them when scoping to one transaction so its
            // full lifecycle trail stays intact.
            ->when(! $transactionId, fn (Builder $q) => $q->where('is_system', false))
            ->when($transactionId, fn ($q) => $q->where('transaction_id', (int) $transactionId))
            ->when($search, fn ($q) => $q->where('message', 'like', "%{$search}%"))
            ->latest()
            ->paginate(min(100, max(1, (int) $request->query('per_page', 15))));

        return $this->paginatedResponse(ActivityLogResource::collection($logs), 'Activity logs retrieved successfully');
    }
}

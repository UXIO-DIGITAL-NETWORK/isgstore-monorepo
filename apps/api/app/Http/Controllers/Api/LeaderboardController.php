<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\LeaderboardResource;
use App\Models\UserSpending;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $period = $request->query('period', 'ALL_TIME');

        $spendings = UserSpending::with('user')
            ->where('period', $period)
            ->orderBy('total_amount', 'desc')
            ->orderBy('last_order_at', 'asc')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 15))));

        return $this->paginatedResponse(LeaderboardResource::collection($spendings), 'Leaderboard retrieved successfully');
    }
}

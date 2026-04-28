<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSpending;
use App\Http\Resources\Api\LeaderboardResource;
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
            ->paginate(15);

        return $this->successResponse([
            'data' => LeaderboardResource::collection($spendings),
            'meta' => [
                'current_page' => $spendings->currentPage(),
                'last_page' => $spendings->lastPage(),
                'per_page' => $spendings->perPage(),
                'total' => $spendings->total(),
            ]
        ], 'Leaderboard retrieved successfully');
    }
}

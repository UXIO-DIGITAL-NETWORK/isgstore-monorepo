<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\GetPublicLeaderboardAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    use ApiResponse;

    private const PERIODS = ['today', 'week', 'month'];

    public function index(Request $request, GetPublicLeaderboardAction $action): JsonResponse
    {
        $period = (string) $request->query('period', 'today');

        if (! in_array($period, self::PERIODS, true)) {
            $period = 'today';
        }

        return $this->successResponse([
            'period' => $period,
            'entries' => $action->execute($period),
        ], 'Leaderboard retrieved successfully');
    }
}

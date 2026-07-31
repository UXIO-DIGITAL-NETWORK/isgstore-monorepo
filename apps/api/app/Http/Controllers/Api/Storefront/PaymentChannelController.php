<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\ListPaymentChannelsAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentChannelController extends Controller
{
    use ApiResponse;

    public function index(Request $request, ListPaymentChannelsAction $action): JsonResponse
    {
        return $this->successResponse(
            $action->execute($request->user('sanctum')),
            'Payment channels retrieved successfully'
        );
    }
}

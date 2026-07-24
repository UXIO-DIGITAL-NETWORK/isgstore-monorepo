<?php

namespace App\Http\Controllers\Api\Payment\Monetapay;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

/**
 * Receives Monetapay subscription lifecycle callbacks.
 *
 * Monetapay expects {"code": 0, "message": "success"} on every callback.
 * The controller logs the payload for observability; extend each method
 * with subscription-status business logic when needed.
 */
class MonetapaySubscriptionCallbackController extends Controller
{
    /** EVT_ACTIVE_SUBSCRIPTION / EVT_INACTIVE_SUBSCRIPTION */
    public function active(Request $request): JsonResponse
    {
        Log::channel('monetapay')->info('Monetapay subscription status callback', $request->all());

        return response()->json(['code' => 0, 'message' => 'success']);
    }

    /** EVT_CYCLE_PREV_TRIGGER — notification sent before deduction */
    public function beforeDeduct(Request $request): JsonResponse
    {
        Log::channel('monetapay')->info('Monetapay subscription before-deduct callback', $request->all());

        return response()->json(['code' => 0, 'message' => 'success']);
    }

    /** EVT_CYCLE_TRIGGERED — deduction result notification */
    public function afterDeduct(Request $request): JsonResponse
    {
        Log::channel('monetapay')->info('Monetapay subscription after-deduct callback', $request->all());

        return response()->json(['code' => 0, 'message' => 'success']);
    }
}

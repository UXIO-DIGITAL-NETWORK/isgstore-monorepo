<?php

namespace App\Http\Controllers\Api\Payment\Monetapay;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

/**
 * Receives Monetapay RDL lifecycle callbacks (customer created, VA paid).
 *
 * Monetapay expects {"code": 0, "message": "success"} on every callback. The
 * payload is logged for observability; extend with persistence/business logic
 * when RDL state needs to be queryable.
 */
class MonetapayRdlCallbackController extends Controller
{
    /** 2.9 Customer Merchant Callback — fired after a customer is created. */
    public function customer(Request $request): JsonResponse
    {
        Log::channel('stack')->info('Monetapay RDL customer callback', $request->all());

        return response()->json(['code' => 0, 'message' => 'success']);
    }

    /** 2.16 VA Merchant Callback — fired after a VA payment completes. */
    public function va(Request $request): JsonResponse
    {
        Log::channel('stack')->info('Monetapay RDL VA callback', $request->all());

        return response()->json(['code' => 0, 'message' => 'success']);
    }
}

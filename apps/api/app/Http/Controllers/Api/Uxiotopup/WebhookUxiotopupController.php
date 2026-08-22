<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\HandleUxiotopupWebhookAction;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookUxiotopupController extends Controller
{
    public function handle(Request $request, HandleUxiotopupWebhookAction $action)
    {
        // The uxiotopup callback carries no signature — the only authentication
        // is the source IP. Requires TrustProxies to be configured so
        // $request->ip() is the real client behind any LB/proxy, otherwise
        // every callback is rejected here.
        $allowedIps = array_filter(array_map('trim', explode(',', (string) config('services.uxiotopup.callback_ips'))));

        if (! in_array($request->ip(), $allowedIps, true)) {
            Log::channel('uxiotopup')->warning('Uxiotopup Webhook: IP not allowed', ['ip' => $request->ip()]);

            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = $request->json()->all();

        // Process transaction updates. Infrastructure failures surface as 5xx so
        // uxiotopup retries delivery; non-retryable cases are handled in the action.
        try {
            $action->execute($payload);
        } catch (Exception $e) {
            Log::channel('uxiotopup')->error('Uxiotopup Webhook processing failed', ['error' => $e->getMessage()]);

            return response()->json(['status' => 'error'], 500);
        }

        return response()->json(['status' => 'OK']);
    }
}

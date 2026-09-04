<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\HandleUxiolabsWebhookAction;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookUxiolabsController extends Controller
{
    public function handle(Request $request, HandleUxiolabsWebhookAction $action)
    {
        // The uxiolabs callback carries no signature — the only authentication
        // is the source IP. Requires TrustProxies to be configured so
        // $request->ip() is the real client behind any LB/proxy, otherwise
        // every callback is rejected here.
        $allowedIps = array_filter(array_map('trim', explode(',', (string) config('services.uxiolabs.callback_ips'))));

        if (! in_array($request->ip(), $allowedIps, true)) {
            Log::channel('uxiolabs')->warning('Uxiolabs Webhook: IP not allowed', ['ip' => $request->ip()]);

            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = $request->json()->all();

        // Process transaction updates. Infrastructure failures surface as 5xx so
        // uxiolabs retries delivery; non-retryable cases are handled in the action.
        try {
            $action->execute($payload);
        } catch (Exception $e) {
            Log::channel('uxiolabs')->error('Uxiolabs Webhook processing failed', ['error' => $e->getMessage()]);

            return response()->json(['status' => 'error'], 500);
        }

        return response()->json(['status' => 'OK']);
    }
}

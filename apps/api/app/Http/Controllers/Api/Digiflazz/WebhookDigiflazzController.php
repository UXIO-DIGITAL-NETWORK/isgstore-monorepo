<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\HandleDigiflazzWebhookAction;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookDigiflazzController extends Controller
{
    public function handle(Request $request, HandleDigiflazzWebhookAction $action)
    {
        $secret = config('services.digiflazz.webhook_secret');
        $postData = $request->getContent();

        // Verify the HMAC-SHA1 signature against the raw body, constant-time.
        $expected = 'sha1='.hash_hmac('sha1', $postData, (string) $secret);

        if (! hash_equals($expected, (string) $request->header('X-Hub-Signature'))) {
            Log::warning('Digiflazz Webhook: Invalid Signature', ['ip' => $request->ip()]);

            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = json_decode($postData, true) ?? [];

        // Digiflazz sends a ping event when the webhook is first registered.
        if (isset($payload['hook_id'])) {
            return response()->json(['message' => 'Webhook active. Ping received.']);
        }

        // Process transaction updates. Infrastructure failures surface as 5xx so
        // Digiflazz retries delivery; non-retryable cases are handled in the action.
        if ($request->header('X-Digiflazz-Event') === 'update' || isset($payload['data'])) {
            try {
                $action->execute($payload);
            } catch (Exception $e) {
                Log::error('Digiflazz Webhook processing failed', ['error' => $e->getMessage()]);

                return response()->json(['status' => 'error'], 500);
            }
        }

        return response()->json(['status' => 'OK']);
    }
}

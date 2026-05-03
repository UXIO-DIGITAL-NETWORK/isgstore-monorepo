<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Actions\Digiflazz\HandleDigiflazzWebhookAction;
use Illuminate\Support\Facades\Log;

class WebhookDigiflazzController extends Controller
{
    public function handle(Request $request, HandleDigiflazzWebhookAction $action)
    {
        // 1. Ambil Secret dari .env
        $secret = env('DIGIFLAZZ_WEBHOOK_SECRET');

        // 2. Ambil raw body dari request (standar keamanan webhook)
        $postData = $request->getContent();

        // 3. Buat ulang signature
        $signature = hash_hmac('sha1', $postData, $secret);

        // 4. Validasi Keamanan (Tolak jika hacker)
        if ($request->header('X-Hub-Signature') !== 'sha1=' . $signature) {
            Log::warning('Digiflazz Webhook: Invalid Signature', ['ip' => $request->ip()]);
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Decode JSON untuk memproses isinya
        $payload = json_decode($postData, true);

        // 5. Antisipasi Ping Event dari Digiflazz
        if (isset($payload['hook_id'])) {
            return response()->json(['message' => 'Ping diterima dengan baik. Webhook aktif!']);
        }

        // 6. Jika ini adalah data transaksi, kirim ke Action
        if ($request->header('X-Digiflazz-Event') === 'update' || isset($payload['data'])) {
            $action->execute($payload);
        }

        // 7. Berikan response 200 OK agar Digiflazz tahu data sudah diterima
        return response()->json(['status' => 'OK']);
    }
}

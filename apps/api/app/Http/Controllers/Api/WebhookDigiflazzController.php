<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;

class WebhookDigiflazzController extends Controller
{
    /**
     * Handle incoming updates from Digiflazz.
     * Update transaction status from PROCESSING to COMPLETED or FAILED_PROVIDER.
     */
    public function handle(Request $request)
    {
        try {
            $payload = $request->all();

            // Digiflazz typically wraps payload in 'data'
            $data = $payload['data'] ?? [];
            if (empty($data)) {
                return response()->json(['message' => 'Empty payload'], 400);
            }

            $refId = $data['ref_id'] ?? null;
            $status = $data['status'] ?? null;

            if (!$refId || !$status) {
                return response()->json(['message' => 'Missing reference id or status'], 400);
            }

            // Find transaction by invoice_number (or reference_id if Digiflazz expects reference_id instead of invoice_number)
            // Note: CheckoutAction currently uses `$invoiceNumber` for order tracking, but we might pass the referenceId to Digiflazz.
            // Assuming `targetUid` or `sn` is updated, but let's locate via `invoice_number`.
            $transaction = Transaction::where('invoice_number', $refId)->first();
            
            if (!$transaction) {
                return response()->json(['message' => 'Transaction not found'], 404);
            }

            // Update status based on webhook data
            // Digiflazz status: Sukses, Gagal, Pending
            if (in_array($transaction->status, ['COMPLETED', 'FAILED_PROVIDER'])) {
                return response()->json(['message' => 'Transaction already processed'], 200);
            }

            if (strtolower($status) === 'sukses') {
                $transaction->update(['status' => 'COMPLETED', 'sn' => $data['sn'] ?? null]);
            } elseif (strtolower($status) === 'gagal') {
                $transaction->update(['status' => 'FAILED_PROVIDER']);
            }

            return response()->json(['message' => 'Webhook processed successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Digiflazz Webhook Error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }
}

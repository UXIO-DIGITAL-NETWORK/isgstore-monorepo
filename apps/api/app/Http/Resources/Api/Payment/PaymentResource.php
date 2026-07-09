<?php

namespace App\Http\Resources\Api\Payment;

use App\Http\Resources\Api\Transaction\TransactionResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_id' => $this->transaction_id,
            'payment_channel_id' => $this->payment_channel_id,
            'reference_id' => $this->reference_id,
            'pg_transaction_id' => $this->pg_transaction_id,
            'gross_amount' => $this->gross_amount,
            'admin_fee' => $this->admin_fee,
            'payment_data' => $this->payment_data,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'transaction' => new TransactionResource($this->whenLoaded('transaction')),
            'payment_channel' => $this->whenLoaded('paymentChannel'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

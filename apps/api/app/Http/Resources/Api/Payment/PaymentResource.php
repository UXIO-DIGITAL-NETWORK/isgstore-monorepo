<?php

namespace App\Http\Resources\Api\Payment;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\Order\OrderResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'payment_method_id' => $this->payment_method_id,
            'reference_id' => $this->reference_id,
            'pg_transaction_id' => $this->pg_transaction_id,
            'gross_amount' => $this->gross_amount,
            'admin_fee' => $this->admin_fee,
            'payment_data' => $this->payment_data,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'order' => new OrderResource($this->whenLoaded('order')),
            'payment_method' => $this->whenLoaded('paymentMethod'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

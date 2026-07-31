<?php

namespace App\Http\Resources\Api\Transaction;

use App\Http\Resources\Api\Payment\PaymentResource;
use App\Http\Resources\Api\Product\ProductResource;
use App\Http\Resources\Api\Supplier\SupplierResource;
use App\Http\Resources\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'user_id' => $this->user_id,
            'payment_channel_id' => $this->payment_channel_id,
            'guest_contact' => $this->guest_contact,
            'product_id' => $this->product_id,
            'supplier_id' => $this->supplier_id,
            'target_uid' => $this->target_uid,
            'target_server' => $this->target_server,
            'target_nickname' => $this->target_nickname,
            'amount_base' => $this->amount_base,
            'amount_fee' => $this->amount_fee,
            'promo_id' => $this->promo_id,
            'discount_amount' => (int) $this->discount_amount,
            'amount_total' => $this->amount_total,
            'total_price' => $this->total_price,
            'margin' => $this->margin,
            'status' => $this->status,
            'is_manual' => (bool) $this->is_manual,
            'sn' => $this->sn,
            'supplier_trx_id' => $this->supplier_trx_id,
            'supplier_status' => $this->supplier_status,
            'proof' => $this->proof,
            'proof_url' => $this->proof ? Storage::disk('public')->url($this->proof) : null,
            'user' => new UserResource($this->whenLoaded('user')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            // PaymentResource → TransactionResource only renders if payment.transaction is loaded;
            // since we don't eager-load that depth, there is no circular rendering in practice.
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'payment_channel' => $this->whenLoaded('paymentChannel'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

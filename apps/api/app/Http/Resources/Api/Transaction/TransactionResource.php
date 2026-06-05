<?php

namespace App\Http\Resources\Api\Transaction;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\Product\ProductResource;
use App\Http\Resources\Api\Supplier\SupplierResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'invoice_number'   => $this->invoice_number,
            'user_id'          => $this->user_id,
            'product_id'       => $this->product_id,
            'supplier_id'      => $this->supplier_id,
            'target_uid'       => $this->target_uid,
            'target_server'    => $this->target_server,
            'total_price'      => $this->total_price,
            'margin'           => $this->margin,
            'status'           => $this->status,
            'is_manual'        => (bool) $this->is_manual,
            'sn'               => $this->sn,
            'supplier_trx_id'  => $this->supplier_trx_id,
            'supplier_status'  => $this->supplier_status,
            'user'             => $this->whenLoaded('user'),
            'product'          => new ProductResource($this->whenLoaded('product')),
            'supplier'         => new SupplierResource($this->whenLoaded('supplier')),
            'created_at'       => $this->created_at,
            'updated_at'       => $this->updated_at,
        ];
    }
}

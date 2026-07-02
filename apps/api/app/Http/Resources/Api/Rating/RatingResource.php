<?php

namespace App\Http\Resources\Api\Rating;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\Transaction\TransactionResource;

class RatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'transaction_id' => $this->transaction_id,
            'user_id'        => $this->user_id,
            'rating'         => $this->rating,
            'user'           => $this->whenLoaded('user'),
            'transaction'    => new TransactionResource($this->whenLoaded('transaction')),
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
        ];
    }
}

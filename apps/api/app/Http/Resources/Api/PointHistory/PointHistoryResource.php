<?php

namespace App\Http\Resources\Api\PointHistory;

use App\Http\Resources\Api\Transaction\TransactionResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PointHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'transaction_id' => $this->transaction_id,
            'points_before' => $this->points_before,
            'points_added' => $this->points_added,
            'points_after' => $this->points_after,
            'description' => $this->description,
            'user' => $this->whenLoaded('user'),
            'transaction' => new TransactionResource($this->whenLoaded('transaction')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

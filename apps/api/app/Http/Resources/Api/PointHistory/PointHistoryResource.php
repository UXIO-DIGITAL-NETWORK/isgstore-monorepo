<?php

namespace App\Http\Resources\Api\PointHistory;

use Illuminate\Http\Request;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\Order\OrderResource;

class PointHistoryResource extends JsonResource
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
            'user_id' => $this->user_id,
            'order_id' => $this->order_id,
            'points_before' => $this->points_before,
            'points_added' => $this->points_added,
            'points_after' => $this->points_after,
            'description' => $this->description,
            'user' => $this->whenLoaded('user'),
            'order' => new OrderResource($this->whenLoaded('order')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

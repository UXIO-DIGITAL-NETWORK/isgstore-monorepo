<?php

namespace App\Http\Resources\Api\Service;

use App\Models\ServiceIncident;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceIncident */
class ServiceIncidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            // Normalised so the client renders one shape regardless of which
            // of the two nullable FKs is set.
            'target' => $this->service_id
                ? ['type' => 'service', 'id' => (int) $this->service_id, 'name' => $this->service?->name]
                : ['type' => 'payment_channel', 'id' => (int) $this->payment_channel_id, 'name' => $this->paymentChannel?->name],
            'severity' => $this->severity?->value,
            'status' => $this->status?->value,
            'message' => $this->message,
            'started_at' => $this->started_at?->toIso8601String(),
            'estimated_resolved_at' => $this->estimated_resolved_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

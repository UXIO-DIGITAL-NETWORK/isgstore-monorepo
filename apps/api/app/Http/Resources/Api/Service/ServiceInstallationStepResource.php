<?php

namespace App\Http\Resources\Api\Service;

use App\Models\ServiceInstallationStep;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceInstallationStep */
class ServiceInstallationStepResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'sort_order' => (int) $this->sort_order,
            'is_completed' => $this->completed_at !== null,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'completed_by' => $this->whenLoaded('completedBy', fn () => $this->completedBy?->name),
        ];
    }
}

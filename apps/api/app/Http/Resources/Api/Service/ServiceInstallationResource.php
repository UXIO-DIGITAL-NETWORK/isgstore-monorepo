<?php

namespace App\Http\Resources\Api\Service;

use App\Models\ServiceInstallation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Progress is DERIVED here — completed steps over total steps — and never read
 * from a column. A stored percentage is a claim that drifts from the checklist
 * it claims to summarise; this cannot.
 *
 * @mixin ServiceInstallation
 */
class ServiceInstallationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $steps = $this->steps;
        $total = $steps->count();
        $completed = $steps->whereNotNull('completed_at')->count();

        return [
            'id' => $this->id,
            'service' => $this->whenLoaded('service', fn () => [
                'id' => $this->service->id,
                'code' => $this->service->code,
                'name' => $this->service->name,
            ]),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
            ]),
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'notes' => $this->notes,
            'steps_total' => $total,
            'steps_completed' => $completed,
            'progress_percent' => $total > 0 ? (int) round($completed / $total * 100) : 0,
            // Also derived: no steps means nothing has been planned yet, which
            // is a different thing from "planned and not started".
            'status' => match (true) {
                $total === 0 => 'NOT_STARTED',
                $completed === $total => 'DONE',
                default => 'IN_PROGRESS',
            },
            'steps' => ServiceInstallationStepResource::collection($steps),
            'details' => ServiceInstallationDetailResource::collection($this->details),
        ];
    }
}

<?php

namespace App\Http\Resources\Api\Uxiolabs;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Passthrough resource, same rationale as UxiolabsPriceListItemResource:
 * ListUxiolabsPoolCandidatesAction already emits fully-shaped rows, and wrapping
 * them keeps this list inside the shared paginated envelope.
 */
class UxiolabsPoolCandidateResource extends JsonResource
{
    /**
     * @return array<string,mixed>
     */
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}

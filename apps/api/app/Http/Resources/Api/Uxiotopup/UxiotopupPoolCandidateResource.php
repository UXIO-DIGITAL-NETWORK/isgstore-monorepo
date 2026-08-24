<?php

namespace App\Http\Resources\Api\Uxiotopup;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Passthrough resource, same rationale as UxiotopupPriceListItemResource:
 * ListUxiotopupPoolCandidatesAction already emits fully-shaped rows, and wrapping
 * them keeps this list inside the shared paginated envelope.
 */
class UxiotopupPoolCandidateResource extends JsonResource
{
    /**
     * @return array<string,mixed>
     */
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}

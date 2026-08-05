<?php

namespace App\Http\Resources\Api\Digiflazz;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Passthrough resource: ListDigiflazzPriceListAction already emits fully-shaped
 * associative rows, so the resource just forwards them. Keeping the collection
 * wrapped in a Resource lets it flow through paginatedResponse() like every
 * other list endpoint, sharing the {status, code, message, data:{data,links,meta}}
 * envelope.
 */
class DigiflazzPriceListItemResource extends JsonResource
{
    /**
     * @return array<string,mixed>
     */
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}

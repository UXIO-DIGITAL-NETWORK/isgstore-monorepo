<?php

namespace App\Http\Resources\Api\Category;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
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
            'type_id' => $this->type_id,
            'name' => $this->name,
            'code' => $this->code,
            'validasi_nickname' => $this->validasi_nickname,
            'region' => $this->region,
            'logo' => $this->logo,
            'description' => $this->description,
            'status' => (bool) $this->status,
            'type' => new CategoryTypeResource($this->whenLoaded('categoryType')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

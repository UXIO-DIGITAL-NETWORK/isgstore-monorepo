<?php

namespace App\Http\Resources\Api\Category\ServerCategoryOption;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\Category\ServerCategory\ServerCategoryResource;

class ServerCategoryOptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $serverCategory = $this->whenLoaded('serverCategory');
        return [
            'id' => $this->id,
            'server_category_id' => $this->server_category_id,
            'name' => $this->name,
            'value' => $this->value,
            'server_category' => $serverCategory ? new ServerCategoryResource($serverCategory) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

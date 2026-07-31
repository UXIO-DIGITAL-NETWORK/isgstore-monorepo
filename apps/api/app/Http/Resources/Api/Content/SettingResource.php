<?php

namespace App\Http\Resources\Api\Content;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group' => $this->group,
            'key' => $this->key,
            // Raw for the form's input, coerced for anything that consumes it —
            // the admin needs the editable string, not a decoded array.
            'value' => $this->value,
            'typed_value' => $this->typedValue(),
            'type' => $this->type,
            'label' => $this->label,
            'is_public' => (bool) $this->is_public,
            'updated_at' => $this->updated_at,
        ];
    }
}

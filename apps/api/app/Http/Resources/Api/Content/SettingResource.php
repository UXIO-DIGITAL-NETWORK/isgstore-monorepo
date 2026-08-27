<?php

namespace App\Http\Resources\Api\Content;

use App\Support\Storefront\MediaUrl;
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
            // An image setting stores a storage path, which the admin cannot
            // render on its own. Null for every other type, and null when the
            // file is missing, so the UI shows "no file" rather than a broken
            // image.
            'value_url' => $this->type === 'image' ? MediaUrl::for($this->value) : null,
            'type' => $this->type,
            'label' => $this->label,
            'is_public' => (bool) $this->is_public,
            'updated_at' => $this->updated_at,
        ];
    }
}

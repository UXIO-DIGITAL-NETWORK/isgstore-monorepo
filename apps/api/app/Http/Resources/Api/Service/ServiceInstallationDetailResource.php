<?php

namespace App\Http\Resources\Api\Service;

use App\Models\ServiceInstallationDetail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A secret's plaintext is NEVER emitted here — `value` is null and only the
 * mask travels. Plaintext leaves the server through the reveal endpoint alone,
 * which is a throttled POST so it is neither cacheable nor logged in a URL.
 *
 * @mixin ServiceInstallationDetail
 */
class ServiceInstallationDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'value' => $this->is_secret ? null : $this->value,
            'masked_value' => $this->is_secret ? $this->maskedValue() : $this->value,
            'is_secret' => (bool) $this->is_secret,
            'sort_order' => (int) $this->sort_order,
        ];
    }
}

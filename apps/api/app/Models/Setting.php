<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * The stored value coerced to the shape `type` promises.
     *
     * Everything is persisted as text, so a consumer that read `value` raw
     * would get "true" and "0" as strings and have to know each key's type to
     * interpret them.
     */
    public function typedValue(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'number' => is_numeric($this->value) ? $this->value + 0 : null,
            'json' => json_decode((string) $this->value, true),
            default => $this->value,
        };
    }
}

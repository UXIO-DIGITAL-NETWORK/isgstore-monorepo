<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Editable per-provider integration credentials. `credentials` is encrypted at
 * rest via the `encrypted:array` cast — plaintext never touches the database.
 */
class IntegrationCredential extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'credentials' => 'encrypted:array',
    ];
}

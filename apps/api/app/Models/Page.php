<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'intro' => 'array',
        'sections' => 'array',
        'is_published' => 'boolean',
    ];
}

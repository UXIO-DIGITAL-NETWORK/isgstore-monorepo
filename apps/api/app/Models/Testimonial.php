<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
    ];
}

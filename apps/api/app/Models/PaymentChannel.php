<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentChannel extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['extra_config' => 'array'];
}

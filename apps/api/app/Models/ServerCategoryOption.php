<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServerCategoryOption extends Model
{
    protected $guarded = ['id'];

    public function serverCategory()
    {
        return $this->belongsTo(ServerCategory::class);
    }
}

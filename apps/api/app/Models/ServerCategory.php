<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServerCategory extends Model
{
    protected $guarded = ['id'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function options()
    {
        return $this->hasMany(ServerCategoryOption::class);
    }
}

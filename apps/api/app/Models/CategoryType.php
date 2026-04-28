<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryType extends Model
{
    protected $guarded = ['id'];

    public function categories()
    {
        return $this->hasMany(Category::class, 'type_id');
    }
}

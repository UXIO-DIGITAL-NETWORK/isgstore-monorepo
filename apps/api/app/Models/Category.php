<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'order_form_fields' => 'array',
            'meta_keywords' => 'array',
        ];
    }

    public function categoryType()
    {
        return $this->belongsTo(CategoryType::class, 'type_id');
    }

    public function subCategories()
    {
        return $this->hasMany(SubCategory::class);
    }

    public function serverCategories()
    {
        return $this->hasMany(ServerCategory::class);
    }
}

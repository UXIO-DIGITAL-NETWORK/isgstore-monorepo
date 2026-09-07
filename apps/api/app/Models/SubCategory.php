<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategory extends Model
{
    use HasFactory;

    // This is the one model in the app with an explicit $fillable rather than
    // $guarded = ['id'], so every new column has to be listed here or mass
    // assignment drops it silently.
    protected $fillable = [
        'category_id',
        'name',
        'currency_name',
        'logo',
        'description',
        'status',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}

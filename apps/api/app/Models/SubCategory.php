<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategory extends Model
{
    use HasFactory;

    // PASTIKAN 'logo' ADA DI SINI!
    protected $fillable = [
        'category_id',
        'name',
        'logo', // <--- Tambahkan ini
        'status',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}

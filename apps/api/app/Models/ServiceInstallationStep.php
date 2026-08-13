<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceInstallationStep extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = ['completed_at' => 'datetime'];

    public function installation()
    {
        return $this->belongsTo(ServiceInstallation::class, 'service_installation_id');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}

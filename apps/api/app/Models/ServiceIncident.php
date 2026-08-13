<?php

namespace App\Models;

use App\Enums\IncidentSeverity;
use App\Enums\IncidentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceIncident extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'severity' => IncidentSeverity::class,
        'status' => IncidentStatus::class,
        'started_at' => 'datetime',
        'estimated_resolved_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function paymentChannel()
    {
        return $this->belongsTo(PaymentChannel::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One movement of `users.point`.
 *
 * Distinct from the legacy `point_histories`, which the admin CRUD writes
 * without ever touching the balance column. This table and `users.point` move
 * together or not at all — see `App\Support\Points\PointLedger`.
 */
class PointLedgerEntry extends Model
{
    protected $table = 'point_ledger';

    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'integer',
        'points_before' => 'integer',
        'points_after' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}

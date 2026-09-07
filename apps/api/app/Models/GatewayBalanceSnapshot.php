<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * One reconciliation run's snapshot of the Monetapay balance vs. what our books
 * predict. See the create migration for the delta-reconciliation rationale.
 *
 * @property Carbon $captured_at
 * @property int $reported_balance
 * @property int $expected_balance
 * @property int $delta
 * @property array|null $meta
 */
class GatewayBalanceSnapshot extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'captured_at' => 'datetime',
        'reported_balance' => 'integer',
        'expected_balance' => 'integer',
        'delta' => 'integer',
        'meta' => 'array',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentChannel extends Model
{
    use HasFactory;

    /**
     * Payment types a customer may actually pay with. The business only offers
     * Virtual Account, E-Wallet, and QRIS. `balance` (the member wallet) is
     * intentionally absent — it is member-only and handled separately, not a
     * public payment category.
     */
    public const ALLOWED_STOREFRONT_PAYMENT_TYPES = ['virtual_account', 'ewallet', 'qris'];

    protected $guarded = ['id'];

    protected $casts = ['extra_config' => 'array'];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}

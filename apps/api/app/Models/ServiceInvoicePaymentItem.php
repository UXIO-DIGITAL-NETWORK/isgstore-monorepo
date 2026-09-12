<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One bill covered by one payment attempt.
 *
 * `amount` is that bill's own figure, exact. `admin_fee` is its SHARE of the one
 * channel fee charged on the batch — apportioned when the attempt opens and
 * stored, so the shares always sum to exactly what was charged. Never recompute
 * it at read time.
 */
class ServiceInvoicePaymentItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'integer',
        'admin_fee' => 'integer',
    ];

    public function payment()
    {
        return $this->belongsTo(ServiceInvoicePayment::class, 'service_invoice_payment_id');
    }

    public function invoice()
    {
        return $this->belongsTo(ServiceInvoice::class, 'service_invoice_id');
    }
}

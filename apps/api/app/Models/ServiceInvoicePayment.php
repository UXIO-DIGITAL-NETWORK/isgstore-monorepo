<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\Payment\PaymentExpiry;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One Monetapay payment attempt against a service invoice.
 *
 * The invoice is the bill; this is an attempt to settle it. Several may exist
 * — an expired QR does not void the bill — but at most one is PENDING per bill.
 *
 * One attempt may cover SEVERAL bills: a client with four things falling due on
 * the same day pays once. `items()` is the authority on which, and for how much
 * each; `service_invoice_id` is populated only for a single-invoice attempt and
 * is a convenience for reading history, never a basis for arithmetic. The money
 * columns here (`amount`, `admin_fee`, `total`) are always the BATCH's.
 */
class ServiceInvoicePayment extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'payment_data' => 'array',
        'paid_at' => 'datetime',
        'amount' => 'integer',
        'admin_fee' => 'integer',
        'total' => 'integer',
        'invoice_count' => 'integer',
    ];

    /** Only set for a single-invoice attempt. Prefer items()/invoices(). */
    public function invoice()
    {
        return $this->belongsTo(ServiceInvoice::class, 'service_invoice_id');
    }

    /** Which bills this attempt covers, with each one's amount and fee share. */
    public function items()
    {
        return $this->hasMany(ServiceInvoicePaymentItem::class);
    }

    public function invoices()
    {
        return $this->belongsToMany(ServiceInvoice::class, 'service_invoice_payment_items')
            ->withPivot(['amount', 'admin_fee'])
            ->withTimestamps();
    }

    public function isBatch(): bool
    {
        return (int) $this->invoice_count > 1;
    }

    public function paymentChannel()
    {
        return $this->belongsTo(PaymentChannel::class);
    }

    /**
     * When the gateway stops accepting this attempt.
     *
     * Reuses the window table the storefront invoice page already runs on, so
     * the countdown a client sees can never disagree with the sweep that
     * closes the attempt. Null means the channel declares no window — never
     * guessed.
     */
    public function expiresAt(): ?CarbonInterface
    {
        $window = PaymentExpiry::windowFor($this->paymentChannel?->payment_type);

        return $window === null ? null : $this->created_at?->copy()->addSeconds($window);
    }

    public function isExpired(): bool
    {
        $expiresAt = $this->expiresAt();

        return $expiresAt !== null && $expiresAt->isPast();
    }
}

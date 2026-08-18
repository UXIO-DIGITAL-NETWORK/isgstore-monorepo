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
 * — an expired QR does not void the bill — but at most one is PENDING.
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
    ];

    public function invoice()
    {
        return $this->belongsTo(ServiceInvoice::class, 'service_invoice_id');
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

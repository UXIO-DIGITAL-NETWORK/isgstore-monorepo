<?php

namespace App\Mail;

use App\Models\RefundRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The two refund emails a guest receives: "tell us where to send it" (claim)
 * and "we sent it" (completed).
 *
 * One Mailable and one view for both, because they differ only in copy and CTA
 * — split into two classes they would drift apart in layout within a release.
 * Sent with `Mail::to()->locale($locale)`, so every `__('refund.*')` resolves
 * to the buyer's language (id | en), exactly like TransactionReceiptMail.
 *
 * The claim URL is passed in rather than derived here: the plaintext token
 * lives for one call and must not be recoverable from a serialized job.
 */
class RefundMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public const VARIANT_CLAIM = 'claim';

    public const VARIANT_COMPLETED = 'completed';

    public function __construct(
        public RefundRequest $refund,
        public string $emailLocale,
        public string $variant = self::VARIANT_CLAIM,
        public ?string $claimUrl = null,
    ) {}

    public function envelope(): Envelope
    {
        $key = $this->variant === self::VARIANT_CLAIM ? 'refund.claim_subject' : 'refund.done_subject';

        return new Envelope(
            subject: __($key, ['invoice' => $this->refund->transaction?->invoice_number ?? $this->refund->refund_number]),
        );
    }

    public function content(): Content
    {
        $refund = $this->refund->loadMissing(['transaction.product']);

        return new Content(
            view: 'emails.refund',
            with: [
                'brand' => (string) config('services.storefront.brand', 'ISG Store'),
                'variant' => $this->variant,
                'invoice' => $refund->transaction?->invoice_number ?? $refund->refund_number,
                'productName' => $refund->transaction?->product?->name,
                'amount' => (int) $refund->amount,
                'destination' => $this->destination(),
                'claimUrl' => $this->claimUrl,
            ],
        );
    }

    /**
     * The payout account, masked. The customer knows their own number, so the
     * last four digits are enough to confirm we used the right one — and a
     * forwarded email then leaks nothing usable.
     */
    private function destination(): ?string
    {
        if ($this->variant !== self::VARIANT_COMPLETED || ! $this->refund->bank_code) {
            return null;
        }

        $number = (string) ($this->refund->account_number ?? $this->refund->account_phone ?? '');
        $masked = $number === '' ? '' : ' ••••'.substr($number, -4);

        return strtoupper((string) $this->refund->bank_code).$masked;
    }
}

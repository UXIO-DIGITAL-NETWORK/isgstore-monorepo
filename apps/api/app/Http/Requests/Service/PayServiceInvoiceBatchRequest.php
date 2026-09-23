<?php

namespace App\Http\Requests\Service;

use App\Actions\Service\OpenServiceInvoicePaymentAction;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Pay several outstanding service bills in one Monetapay attempt.
 *
 * Ownership is re-checked in the controller against the caller's own invoices —
 * `payment-admin` proves *a* client is calling, not *which*.
 */
class PayServiceInvoiceBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'invoice_ids' => ['required', 'array', 'min:1', 'max:'.OpenServiceInvoicePaymentAction::MAX_INVOICES],
            'invoice_ids.*' => ['integer', 'distinct', 'exists:service_invoices,id'],
            'payment_channel_id' => ['required', 'integer', 'exists:payment_channels,id'],
        ];
    }
}

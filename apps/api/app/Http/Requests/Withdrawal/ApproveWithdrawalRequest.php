<?php

namespace App\Http\Requests\Withdrawal;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Kita approves a withdrawal. A manual payout requires the bukti transfer
 * (transfer receipt) as proof; a Monetapay disbursement settles automatically
 * so no proof is uploaded up front.
 */
class ApproveWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'method' => ['nullable', 'in:manual,monetapay'],
            'proof' => ['required_if:method,manual', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:4096'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Default to manual so `required_if` fires when the client omits method.
        if (! $this->filled('method')) {
            $this->merge(['method' => 'manual']);
        }
    }

    public function method(): string
    {
        return $this->input('method', 'manual');
    }
}

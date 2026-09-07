<?php

namespace App\Http\Requests\Withdrawal;

use App\Support\Payout\BankCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInternalWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route-gated: `payment-internal` for the on-site panel, `hub`+`hub-write`
        // (read key AND write key) when the Hub raises one remotely.
        return true;
    }

    public function rules(): array
    {
        // Same floor as StoreWithdrawalRequest — nett = amount - fee must stay
        // positive.
        $min = max(1, (int) config('services.withdrawal.min_amount', 1));

        return [
            'amount' => ['required', 'integer', "min:{$min}"],
            'bank_code' => ['required', 'string', Rule::in(BankCatalog::codes())],
            'account_number' => [
                Rule::requiredIf(fn () => ! BankCatalog::isEwallet((string) $this->input('bank_code'))),
                'nullable', 'string', 'max:50',
            ],
            'account_name' => ['required', 'string', 'max:255'],
            'account_phone' => [
                Rule::requiredIf(fn () => BankCatalog::isEwallet((string) $this->input('bank_code'))),
                'nullable', 'string', 'max:20',
            ],
            'notes' => ['nullable', 'string', 'max:255'],
            // Sent by a caller that cannot see its own outcome (the Hub) so a
            // retry after a lost ack resolves to the same row. Never required:
            // the on-site panel has a human watching.
            'idempotency_key' => ['nullable', 'string', 'max:64'],
        ];
    }
}

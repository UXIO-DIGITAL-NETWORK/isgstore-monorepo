<?php

namespace App\Http\Requests\Withdrawal;

use App\Support\Payout\BankCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The `merchant` middleware gates the route; the action scopes to the
        // caller's own id.
        return true;
    }

    public function rules(): array
    {
        // Floor the request at the configured minimum so `nett = amount - fee`
        // can never go non-positive (a Rp 1.000 request would net -610 under the
        // 1500 + 11% schedule) and small payouts clear the gateway minimum.
        $min = max(1, (int) config('services.withdrawal.min_amount', 1));

        return [
            'amount' => ['required', 'integer', "min:{$min}"],
            // Must be a code Monetapay can pay out to (config/banks.php).
            'bank_code' => ['required', 'string', Rule::in(BankCatalog::codes())],
            // Bank payouts need an account number; e-wallet payouts are keyed on
            // the phone instead, so account_number is optional for those.
            'account_number' => [
                Rule::requiredIf(fn () => ! BankCatalog::isEwallet((string) $this->input('bank_code'))),
                'nullable', 'string', 'max:50',
            ],
            'account_name' => ['required', 'string', 'max:255'],
            // Beneficiary phone: required for e-wallet payouts (the wallet id),
            // and used as the disbursement account_phone for banks too.
            'account_phone' => [
                Rule::requiredIf(fn () => BankCatalog::isEwallet((string) $this->input('bank_code'))),
                'nullable', 'string', 'max:20',
            ],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}

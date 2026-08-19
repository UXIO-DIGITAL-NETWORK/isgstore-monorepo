<?php

namespace App\Http\Requests\Withdrawal;

use Illuminate\Foundation\Http\FormRequest;

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
            'bank_code' => ['required', 'string', 'max:50'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}

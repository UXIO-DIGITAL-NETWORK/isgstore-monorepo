<?php

namespace App\Http\Requests\Refund;

use App\DTOs\Refund\SubmitPayoutDetailsDTO;
use App\Support\Payout\BankCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Where a guest wants their refund sent. Shared by the public claim page and
 * the admin filling the details in on the customer's behalf — the rules must
 * be identical, or the two routes would accept different accounts.
 *
 * The catalogue is the same one withdrawals validate against, so a refund can
 * only ever be addressed somewhere the platform can actually pay.
 */
class SubmitPayoutDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public route: the claim token is the credential, checked in the
        // controller. Admin route: the `admin` middleware is the gate.
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_code' => ['required', 'string', Rule::in(BankCatalog::codes())],
            // Bank payouts need an account number; e-wallet payouts are keyed
            // on the phone instead — mirrors StoreWithdrawalRequest exactly.
            'account_number' => [
                Rule::requiredIf(fn () => ! BankCatalog::isEwallet((string) $this->input('bank_code'))),
                'nullable', 'string', 'max:50',
            ],
            'account_name' => ['required', 'string', 'max:255'],
            'account_phone' => [
                Rule::requiredIf(fn () => BankCatalog::isEwallet((string) $this->input('bank_code'))),
                'nullable', 'string', 'max:20',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'bank_code.required' => 'Pilih bank atau e-wallet tujuan.',
            'bank_code.in' => 'Bank atau e-wallet tersebut tidak didukung.',
            'account_number.required' => 'Nomor rekening wajib diisi.',
            'account_name.required' => 'Nama pemilik rekening wajib diisi.',
            'account_phone.required' => 'Nomor e-wallet wajib diisi.',
        ];
    }

    public function toDTO(): SubmitPayoutDetailsDTO
    {
        return new SubmitPayoutDetailsDTO(
            bankCode: $this->validated('bank_code'),
            accountNumber: $this->validated('account_number'),
            accountName: $this->validated('account_name'),
            accountPhone: $this->validated('account_phone'),
        );
    }
}

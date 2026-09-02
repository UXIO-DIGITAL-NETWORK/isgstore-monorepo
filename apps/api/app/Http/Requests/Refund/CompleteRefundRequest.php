<?php

namespace App\Http\Requests\Refund;

use Illuminate\Foundation\Http\FormRequest;

class CompleteRefundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Bukti transfer, and only the retired bank-transfer path has one:
            // a balance credit leaves its evidence in `balance_mutations`, not
            // in a screenshot. Nullable rather than required_if because even a
            // real transfer may come from a banking app that gives no
            // downloadable receipt — blocking it would push admins to upload a
            // screenshot of nothing. Same allowances as the manual-review proof.
            'proof' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:2048'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}

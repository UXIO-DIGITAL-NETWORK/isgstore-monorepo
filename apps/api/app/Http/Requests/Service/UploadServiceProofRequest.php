<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The client's bukti transfer for a service invoice. Same rule as
 * ApproveWithdrawalRequest's proof so both upload surfaces agree on what the
 * frontend may send.
 */
class UploadServiceProofRequest extends FormRequest
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
            'proof' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:4096'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}

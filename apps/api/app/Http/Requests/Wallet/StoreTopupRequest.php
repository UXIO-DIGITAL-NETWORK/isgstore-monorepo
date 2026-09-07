<?php

namespace App\Http\Requests\Wallet;

use App\DTOs\Wallet\CreateTopupDTO;
use App\Models\Setting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTopupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // The floor is a setting rather than a literal so operations can raise
        // it without a deploy.
        $minimum = (int) (Setting::where('key', 'min_topup_amount')->value('value') ?: 10000);

        return [
            'amount' => ['required', 'integer', "min:{$minimum}", 'max:10000000'],
            'payment_channel_id' => [
                'required',
                // The wallet cannot pay for itself.
                Rule::exists('payment_channels', 'id')->where('is_active', true)->whereNot('channel_code', 'balance'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_channel_id.exists' => 'Metode pembayaran tidak tersedia untuk isi saldo.',
        ];
    }

    public function toDTO(): CreateTopupDTO
    {
        return new CreateTopupDTO(
            userId: (int) $this->user()->id,
            paymentChannelId: (int) $this->validated('payment_channel_id'),
            amount: (int) $this->validated('amount'),
        );
    }
}

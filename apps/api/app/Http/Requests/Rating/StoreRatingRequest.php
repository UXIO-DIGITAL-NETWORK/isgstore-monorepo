<?php

namespace App\Http\Requests\Rating;

use App\DTOs\Rating\CreateRatingDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRatingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'transaction_id' => ['required', 'exists:transactions,id'],
            'user_id' => ['required', 'exists:users,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ];
    }

    public function toDTO(): CreateRatingDTO
    {
        return new CreateRatingDTO(
            transactionId: (int) $this->validated('transaction_id'),
            userId: (int) $this->validated('user_id'),
            rating: (int) $this->validated('rating')
        );
    }
}

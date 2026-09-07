<?php

namespace App\Http\Requests\Rating;

use App\DTOs\Rating\UpdateRatingDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRatingRequest extends FormRequest
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
            // Nullable since ratings.user_id became nullable for guest reviews —
            // requiring it here made every guest review uneditable.
            'user_id' => ['nullable', 'exists:users,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            // Same ceiling the storefront submit paths validate against.
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function toDTO(): UpdateRatingDTO
    {
        $userId = $this->validated('user_id');
        $comment = $this->validated('comment');

        return new UpdateRatingDTO(
            transactionId: (int) $this->validated('transaction_id'),
            userId: $userId === null ? null : (int) $userId,
            rating: (int) $this->validated('rating'),
            comment: $comment === null ? null : (string) $comment
        );
    }
}

<?php

namespace App\Http\Requests\Rating;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Rating\CreateRatingDTO;
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
            'order_id' => ['required', 'exists:orders,id'],
            'user_id' => ['required', 'exists:users,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ];
    }

    public function toDTO(): CreateRatingDTO
    {
        return new CreateRatingDTO(
            orderId: (int) $this->validated('order_id'),
            userId: (int) $this->validated('user_id'),
            rating: (int) $this->validated('rating')
        );
    }
}

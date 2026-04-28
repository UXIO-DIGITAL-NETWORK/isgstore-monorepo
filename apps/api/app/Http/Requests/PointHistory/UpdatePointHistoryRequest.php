<?php

namespace App\Http\Requests\PointHistory;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\PointHistory\UpdatePointHistoryDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePointHistoryRequest extends FormRequest
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
            'user_id' => ['required', 'exists:users,id'],
            'order_id' => ['nullable', 'exists:orders,id'],
            'points_before' => ['required', 'integer'],
            'points_added' => ['required', 'integer'],
            'points_after' => ['required', 'integer'],
            'description' => ['required', 'string', 'max:255'],
        ];
    }

    public function toDTO(): UpdatePointHistoryDTO
    {
        return new UpdatePointHistoryDTO(
            userId: (int) $this->validated('user_id'),
            orderId: $this->validated('order_id') ? (int) $this->validated('order_id') : null,
            pointsBefore: (int) $this->validated('points_before'),
            pointsAdded: (int) $this->validated('points_added'),
            pointsAfter: (int) $this->validated('points_after'),
            description: $this->validated('description')
        );
    }
}

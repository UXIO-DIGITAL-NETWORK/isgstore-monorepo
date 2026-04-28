<?php

namespace App\Actions\Rating;

use App\Models\Rating;
use App\DTOs\Rating\CreateRatingDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateRatingAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateRatingDTO $dto): Rating
    {
        $rating = Rating::create([
            'order_id' => $dto->orderId,
            'user_id' => $dto->userId,
            'rating' => $dto->rating,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created Rating: {$dto->rating} for Order ID: {$dto->orderId}"
        ));

        return $rating;
    }
}

<?php

namespace App\Actions\Category\CategoryType;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\CategoryType\UpdateCategoryTypeDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\CategoryType;
use Illuminate\Support\Facades\Auth;

class UpdateCategoryTypeAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CategoryType $categoryType, UpdateCategoryTypeDTO $dto): CategoryType
    {
        $categoryType->update([
            'name' => $dto->name,
            'is_voucher' => $dto->isVoucher,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Category Type: {$categoryType->name}"
        ));

        return $categoryType->fresh();
    }
}

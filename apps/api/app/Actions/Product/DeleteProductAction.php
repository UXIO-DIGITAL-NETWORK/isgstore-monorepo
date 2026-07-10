<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class DeleteProductAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Product $product): bool
    {
        $name = $product->name;
        $deleted = $product->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Product: {$name}"
            ));
        }

        return $deleted;
    }
}

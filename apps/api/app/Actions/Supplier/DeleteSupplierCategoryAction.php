<?php

namespace App\Actions\Supplier;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SupplierCategory;
use Illuminate\Support\Facades\Auth;

class DeleteSupplierCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SupplierCategory $supplierCategory): bool
    {
        $providerCategory = $supplierCategory->provider_category;
        $deleted = $supplierCategory->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Category Provider: {$providerCategory}"
            ));
        }

        return $deleted;
    }
}
